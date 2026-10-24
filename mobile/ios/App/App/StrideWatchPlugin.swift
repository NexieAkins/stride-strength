import Capacitor
import WatchConnectivity

@objc(StrideWatchPlugin)
public class StrideWatchPlugin: CAPPlugin, CAPBridgedPlugin, WCSessionDelegate {
    public let identifier = "StrideWatchPlugin"
    public let jsName = "StrideWatch"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startWatchWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "control", returnType: CAPPluginReturnPromise)
    ]
    private var activeRun: String?
    private var lastMetrics: [String: Any]?
    public override func load() {
        guard WCSession.isSupported() else { return }
        WCSession.default.delegate = self
        WCSession.default.activate()
    }
    @objc func getStatus(_ call: CAPPluginCall) {
        let session = WCSession.default
        call.resolve(["paired": session.isPaired, "installed": session.isWatchAppInstalled,
                      "reachable": session.isReachable, "metrics": lastMetrics ?? [:]])
    }
    @objc func startWatchWorkout(_ call: CAPPluginCall) {
        guard let id = call.getString("runId"), UUID(uuidString: id) != nil else {
            call.reject("Invalid workout identifier."); return
        }
        guard activeRun == nil || lastMetrics?["state"] as? String == "ended" else {
            call.reject("Finish the workout already running on your watch first."); return
        }
        guard WCSession.default.activationState == .activated,
              WCSession.default.isPaired else {
            call.reject("No paired Apple Watch found. Pair your watch in the iPhone Watch app."); return
        }
        guard WCSession.default.isWatchAppInstalled else {
            call.reject("Install Stride & Strength on your watch: open the iPhone Watch app, find Stride & Strength and tap Install."); return
        }
        guard WCSession.default.isReachable else {
            call.reject("Open Stride & Strength on your watch and keep it on screen, then tap Start again. You can also start the workout from the watch."); return
        }
        activeRun = id
        WCSession.default.sendMessage(["action": "start", "runId": id], replyHandler: { result in
            DispatchQueue.main.async {
                if result["ok"] as? Bool == true { call.resolve() }
                else { self.activeRun = nil; call.reject(result["error"] as? String ?? "Watch could not start.") }
            }
        }, errorHandler: { _ in DispatchQueue.main.async {
            self.activeRun = nil; call.reject("Watch did not respond. Check it before trying again.")
        } })
    }
    @objc func control(_ call: CAPPluginCall) {
        guard let action = call.getString("action"), ["pause", "resume", "finish"].contains(action),
              let id = call.getString("runId"), id == activeRun else {
            call.reject("This workout is not connected."); return
        }
        guard WCSession.default.isReachable else {
            call.reject("Watch is not reachable. Use the controls on your watch."); return
        }
        WCSession.default.sendMessage(["action": action, "runId": id], replyHandler: { result in
            DispatchQueue.main.async {
                if result["ok"] as? Bool == true { call.resolve() }
                else { call.reject(result["error"] as? String ?? "Watch control failed.") }
            }
        }, errorHandler: { _ in call.reject("Watch is not reachable. Use the watch controls.") })
    }
    private func receive(_ message: [String: Any]) {
        DispatchQueue.main.async {
            guard let id = message["runId"] as? String else { return }
            if self.activeRun == nil || self.lastMetrics?["state"] as? String == "ended", (message["state"] as? String) != "ended" { self.activeRun = id }
            guard id == self.activeRun else { return }
            self.lastMetrics = message
            self.notifyListeners("watchMetrics", data: message, retainUntilConsumed: true)
        }
    }
    public func session(_ session: WCSession, didReceiveMessage message: [String: Any]) { receive(message) }
    public func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) { receive(context) }
    public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    public func sessionDidBecomeInactive(_ session: WCSession) {}
    public func sessionDidDeactivate(_ session: WCSession) { session.activate() }
}
