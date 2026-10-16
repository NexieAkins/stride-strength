import SwiftUI
import HealthKit
import WatchConnectivity

@main
struct StrideWatchApp: App {
    @StateObject private var workout = WatchWorkout()
    var body: some Scene {
        WindowGroup {
            ScrollView {
                VStack(spacing: 12) {
                    Text("Stride & Strength").font(.headline)
                    Text(workout.message).font(.caption)
                    if workout.session != nil {
                        TimelineView(.periodic(from: .now, by: 1)) { _ in
                            Text(workout.timeText).font(.title2.monospacedDigit())
                        }
                        Text(String(format: "%.2f mi", workout.metres / 1609.344))
                        Text(workout.heartRate > 0 ? "\(Int(workout.heartRate)) bpm" : "Heart rate —")
                        if workout.state != "ended" {
                            Button(workout.state == "paused" ? "Resume" : "Pause") { workout.control(workout.state == "paused" ? "resume" : "pause") }
                            Button("Finish workout") { workout.control("finish") }
                        }
                    } else {
                        Button("Start workout") { workout.startHere() }
                        Text("Or tap Start on Apple Watch in the iPhone app.").font(.caption2).foregroundStyle(.secondary)
                    }
                }.padding()
            }
        }
    }
}

final class WatchWorkout: NSObject, ObservableObject, WCSessionDelegate, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
    @Published var message = "Ready to connect"
    @Published var state = "ready"
    @Published var metres = 0.0
    @Published var heartRate = 0.0
    @Published var session: HKWorkoutSession?
    private let health = HKHealthStore()
    private var builder: HKLiveWorkoutBuilder?
    private var runId = ""
    private var lastHeartAt: Date?
    private var starting = false
    private var accumulated = 0.0
    private var runningSince: Date?
    var seconds: Double { accumulated + (runningSince.map { max(0, Date().timeIntervalSince($0)) } ?? 0) }
    var timeText: String { let n = Int(seconds); return String(format: "%02d:%02d:%02d", n/3600, n%3600/60, n%60) }
    override init() {
        super.init()
        if WCSession.isSupported() { WCSession.default.delegate = self; WCSession.default.activate() }
    }
    private func start(_ id: String, reply: @escaping ([String: Any]) -> Void) {
        guard !starting, session == nil || state == "ended" else { reply(["ok":false,"error":"A watch workout is already active."]); return }
        guard HKHealthStore.isHealthDataAvailable() else { reply(["ok":false,"error":"Health data is unavailable."]); return }
        starting = true
        let heart = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let distance = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!
        health.requestAuthorization(toShare: [HKObjectType.workoutType()], read: [heart, distance]) { success, error in
            DispatchQueue.main.async {
                self.starting = false
                guard success else { reply(["ok":false,"error":"Allow workout access on the watch to start."]); return }
                do {
                    let config = HKWorkoutConfiguration(); config.activityType = .running; config.locationType = .outdoor
                    let session = try HKWorkoutSession(healthStore: self.health, configuration: config)
                    let builder = session.associatedWorkoutBuilder()
                    builder.dataSource = HKLiveWorkoutDataSource(healthStore: self.health, workoutConfiguration: config)
                    session.delegate = self; builder.delegate = self
                    self.runId = id; self.session = session; self.builder = builder
                    self.accumulated = 0; self.metres = 0; self.heartRate = 0
                    let now = Date(); self.runningSince = now; self.state = "running"; self.message = "Recording on your watch"
                    session.startActivity(with: now)
                    builder.beginCollection(withStart: now) { ok, _ in
                        DispatchQueue.main.async {
                            if ok { reply(["ok":true]); self.publish() }
                            else { self.message = "Could not start workout collection."; session.end(); reply(["ok":false,"error":self.message]) }
                        }
                    }
                } catch { reply(["ok":false,"error":"Could not create the watch workout."]) }
            }
        }
    }
    func startHere() { start(UUID().uuidString) { result in if result["ok"] as? Bool != true { self.message = result["error"] as? String ?? "Could not start." } } }
    func control(_ action: String) {
        guard let session, state != "ended" else { return }
        if action == "pause", state == "running" { accumulated = seconds; runningSince = nil; state = "paused"; session.pause() }
        else if action == "resume", state == "paused" { runningSince = Date(); state = "running"; session.resume() }
        else if action == "finish" { accumulated = seconds; runningSince = nil; state = "ending"; session.end() }
        publish()
    }
    private func publish() {
        let value: [String: Any] = ["runId":runId,"state":state,"elapsedSeconds":seconds,"distanceMeters":metres,"heartRate":Date().timeIntervalSince(lastHeartAt ?? .distantPast) <= 15 ? heartRate : 0,"measuredAt":Date().timeIntervalSince1970]
        guard WCSession.default.activationState == .activated else { return }
        try? WCSession.default.updateApplicationContext(value)
        if WCSession.default.isReachable { WCSession.default.sendMessage(value, replyHandler:nil, errorHandler:nil) }
    }
    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async {
            guard let id = message["runId"] as? String, UUID(uuidString:id) != nil,
                  let action = message["action"] as? String else { replyHandler(["ok":false]); return }
            if action == "start" { self.start(id, reply:replyHandler) }
            else if id == self.runId, ["pause","resume","finish"].contains(action) { self.control(action); replyHandler(["ok":true]) }
            else { replyHandler(["ok":false,"error":"Workout identifiers do not match."]) }
        }
    }
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
        DispatchQueue.main.async {
            for type in collectedTypes {
                guard let quantity = type as? HKQuantityType, let stat = workoutBuilder.statistics(for:quantity) else { continue }
                if quantity.identifier == HKQuantityTypeIdentifier.heartRate.rawValue {
                    self.lastHeartAt = Date()
                    self.heartRate = stat.mostRecentQuantity()?.doubleValue(for: .count().unitDivided(by: .minute())) ?? 0
                } else if quantity.identifier == HKQuantityTypeIdentifier.distanceWalkingRunning.rawValue {
                    self.metres = stat.sumQuantity()?.doubleValue(for:.meter()) ?? self.metres
                }
            }
            self.publish()
        }
    }
    func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {
        guard toState == .ended else { return }
        builder?.endCollection(withEnd:date) { _, _ in
            self.builder?.finishWorkout { workout, error in DispatchQueue.main.async {
                self.state = "ended"; self.message = workout != nil ? "Workout saved to Apple Health. Review it on your iPhone." : "Workout ended; Apple Health could not save it. Review on your iPhone."
                self.publish()
            } }
        }
    }
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
        DispatchQueue.main.async { self.accumulated = self.seconds; self.runningSince = nil; self.state = "ended"; self.message = "Workout interrupted. Review your recorded values."; self.publish() }
    }
}
