#include "cpu_profiler.h"

namespace nodex {
  void Initialize (Handle<Object> target) {
    HandleScope scope;
    CpuProfiler::Initialize(target);
  }

  NODE_MODULE(profiler, Initialize)
}
