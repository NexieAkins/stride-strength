import Capacitor
import HealthKit

@objc(StrideHealthPlugin)
public class StrideHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StrideHealthPlugin"
    public let jsName = "StrideHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchWorkouts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveWorkout", returnType: CAPPluginReturnPromise)
    ]
    private let store = HKHealthStore()

    private func quantity(_ id: HKQuantityTypeIdentifier) -> HKQuantityType? {
        return HKQuantityType.quantityType(forIdentifier: id)
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Health is not available on this device."); return
        }
        var share = Set<HKSampleType>()
        share.insert(HKObjectType.workoutType())
        var read = Set<HKObjectType>()
        read.insert(HKObjectType.workoutType())
        let writeIds: [HKQuantityTypeIdentifier] = [.activeEnergyBurned, .distanceWalkingRunning, .distanceCycling]
        for id in writeIds { if let t = quantity(id) { share.insert(t) } }
        let readIds: [HKQuantityTypeIdentifier] = [.activeEnergyBurned, .distanceWalkingRunning, .distanceCycling, .distanceSwimming, .heartRate]
        for id in readIds { if let t = quantity(id) { read.insert(t) } }
        store.requestAuthorization(toShare: share, read: read) { success, error in
            if let error = error { call.reject(error.localizedDescription); return }
            call.resolve(["granted": success])
        }
    }

    private func activityName(_ type: HKWorkoutActivityType) -> String {
        switch type {
        case .running: return "running"
        case .walking: return "walking"
        case .hiking: return "hiking"
        case .cycling: return "cycling"
        case .swimming: return "swimming"
        case .traditionalStrengthTraining: return "traditionalStrengthTraining"
        case .functionalStrengthTraining: return "functionalStrengthTraining"
        case .coreTraining: return "coreTraining"
        case .highIntensityIntervalTraining: return "hiit"
        case .yoga: return "yoga"
        default: return "other"
        }
    }

    private func distanceMiles(_ w: HKWorkout) -> Double? {
        let mile = HKUnit.mile()
        if #available(iOS 16.0, *) {
            let ids: [HKQuantityTypeIdentifier] = [.distanceWalkingRunning, .distanceCycling, .distanceSwimming]
            for id in ids {
                if let t = quantity(id), let q = w.statistics(for: t)?.sumQuantity() {
                    return q.doubleValue(for: mile)
                }
            }
        }
        if let q = w.totalDistance { return q.doubleValue(for: mile) }
        return nil
    }

    private func energyKcal(_ w: HKWorkout) -> Double? {
        let kcal = HKUnit.kilocalorie()
        if #available(iOS 16.0, *) {
            if let t = quantity(.activeEnergyBurned), let q = w.statistics(for: t)?.sumQuantity() {
                return q.doubleValue(for: kcal)
            }
        }
        if let q = w.totalEnergyBurned { return q.doubleValue(for: kcal) }
        return nil
    }

    @objc func fetchWorkouts(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve(["workouts": [[String: Any]]()]); return }
        let sinceMs = call.getDouble("sinceMs") ?? (Date().timeIntervalSince1970 - 30 * 86400) * 1000
        let since = Date(timeIntervalSince1970: sinceMs / 1000)
        let predicate = HKQuery.predicateForSamples(withStart: since, end: nil, options: [])
        // Newest first so a long gap can never hide the most recent workouts behind the limit.
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: HKObjectType.workoutType(), predicate: predicate, limit: 200, sortDescriptors: [sort]) { [weak self] _, samples, error in
            guard let self = self else { return }
            if let error = error { call.reject(error.localizedDescription); return }
            var out: [[String: Any]] = []
            for sample in (samples ?? []) {
                guard let w = sample as? HKWorkout else { continue }
                var item: [String: Any] = [
                    "uuid": w.uuid.uuidString,
                    "start": w.startDate.timeIntervalSince1970 * 1000,
                    "end": w.endDate.timeIntervalSince1970 * 1000,
                    "activityType": self.activityName(w.workoutActivityType),
                    "durationSec": w.duration,
                    "sourceBundleId": w.sourceRevision.source.bundleIdentifier,
                    "sourceName": w.sourceRevision.source.name
                ]
                if let d = self.distanceMiles(w) { item["distanceMiles"] = d }
                if let e = self.energyKcal(w) { item["energyKcal"] = e }
                if let ext = w.metadata?[HKMetadataKeyExternalUUID] as? String { item["externalId"] = ext }
                out.append(item)
            }
            call.resolve(["workouts": out])
        }
        store.execute(query)
    }

    private func activityType(_ name: String) -> HKWorkoutActivityType {
        switch name {
        case "running": return .running
        case "walking": return .walking
        case "cycling": return .cycling
        case "strength": return .traditionalStrengthTraining
        case "core": return .coreTraining
        default: return .other
        }
    }

    @objc func saveWorkout(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.reject("Apple Health is not available on this device."); return }
        guard let id = call.getString("id"), !id.isEmpty,
              let startMs = call.getDouble("startMs"), let endMs = call.getDouble("endMs"), endMs > startMs else {
            call.reject("Invalid workout."); return
        }
        if store.authorizationStatus(for: HKObjectType.workoutType()) == .sharingDenied {
            call.reject("Apple Health write access is turned off for Stride & Strength."); return
        }
        let activity = call.getString("activity") ?? "other"
        let start = Date(timeIntervalSince1970: startMs / 1000)
        let end = Date(timeIntervalSince1970: endMs / 1000)
        let config = HKWorkoutConfiguration()
        config.activityType = activityType(activity)
        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: HKDevice.local())

        var samples: [HKSample] = []
        if let miles = call.getDouble("distanceMiles"), miles > 0 {
            let qid: HKQuantityTypeIdentifier? = (activity == "running" || activity == "walking") ? .distanceWalkingRunning : (activity == "cycling" ? .distanceCycling : nil)
            if let qid = qid, let type = quantity(qid) {
                samples.append(HKQuantitySample(type: type, quantity: HKQuantity(unit: HKUnit.mile(), doubleValue: miles), start: start, end: end))
            }
        }
        if let kcal = call.getDouble("energyKcal"), kcal > 0, let type = quantity(.activeEnergyBurned) {
            samples.append(HKQuantitySample(type: type, quantity: HKQuantity(unit: HKUnit.kilocalorie(), doubleValue: kcal), start: start, end: end))
        }
        let metadata: [String: Any] = [HKMetadataKeyExternalUUID: id, "StrideStrengthId": id]

        builder.beginCollection(withStart: start) { ok, error in
            guard ok else { call.reject(error?.localizedDescription ?? "Could not start saving to Apple Health."); return }
            builder.addMetadata(metadata) { ok, error in
                guard ok else { call.reject(error?.localizedDescription ?? "Could not add workout details."); return }
                let finish = {
                    builder.endCollection(withEnd: end) { ok, error in
                        guard ok else { call.reject(error?.localizedDescription ?? "Could not end the workout."); return }
                        builder.finishWorkout { workout, error in
                            if let workout = workout { call.resolve(["uuid": workout.uuid.uuidString]) }
                            else { call.reject(error?.localizedDescription ?? "Could not save the workout to Apple Health.") }
                        }
                    }
                }
                if samples.isEmpty { finish() }
                else {
                    builder.add(samples) { ok, error in
                        guard ok else { call.reject(error?.localizedDescription ?? "Could not add workout measurements."); return }
                        finish()
                    }
                }
            }
        }
    }
}
