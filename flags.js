/* Feature flags for the workout UI rebuild. Defined first so later scripts can read them.
   Anything set on window.STRIDE_FLAGS before this file loads (e.g. by a test) wins. */
window.STRIDE_FLAGS=Object.assign({newSetTable:true,floatingBar:true,logForm:true},window.STRIDE_FLAGS||{});
