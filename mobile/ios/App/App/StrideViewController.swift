import Capacitor
class StrideViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(StrideWatchPlugin())
        bridge?.registerPluginInstance(StrideHealthPlugin())
    }
}
