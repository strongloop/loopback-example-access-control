#include <node.h>
#include <v8.h>
#include <uv.h>
#include <string.h> /* memset */

using namespace v8;

static uv_check_t check_handle;

typedef struct {
  uint32_t count;
  uint32_t sum_ms;
  uint32_t slowest_ms;
} mon_stats_t;

mon_stats_t uv_run_stats;


/* 
 * This is the callback that we register to be called at the end of 
 * the uv_run() loop.
 */
static void check_cb(uv_check_t* handle, int status) {
if (handle == NULL) {
    return;
  }
  if (handle->loop == NULL) {
    return;
  }
  uv_loop_t* loop = handle->loop;

#ifdef _WIN32
  uv_loop_t tmp_loop;
  memcpy(&tmp_loop, loop, sizeof(tmp_loop));
  uv_update_time(&tmp_loop);
  uint32_t now = tmp_loop.time;
#else
  uint32_t now = uv_hrtime() / 1000000;
#endif

  uint32_t delta;
  
  /* shouldn't have to check for this, but I swear I saw it happen once */
  if (now < loop->time) {
    delta = 0;
  } else {
    delta = (now - loop->time);
  }
  
  uv_run_stats.count++;
  uv_run_stats.sum_ms += delta;
  if (delta > uv_run_stats.slowest_ms) {
    uv_run_stats.slowest_ms = delta;
  }
}


/* 
 * Returns the data gathered from the uv_run() loop.
 * Resets all counters when called.
 */ 
Handle<Value> getData(const Arguments& args) {
  HandleScope scope;
  
  Local<Object> obj = Object::New();
  obj->Set(String::NewSymbol("count"), Integer::New(uv_run_stats.count));
  obj->Set(String::NewSymbol("sum_ms"), Integer::New(uv_run_stats.sum_ms));
  obj->Set(String::NewSymbol("slowest_ms"),
           Integer::New(uv_run_stats.slowest_ms));
  
  memset(&uv_run_stats, 0, sizeof(uv_run_stats));
  
  return scope.Close(obj);
}


/*
 * Stops the check callback.
 * Only used when loading multiple instances of uvmon (ie testing).
 */
Handle<Value> stop(const Arguments& arg) {
  HandleScope scope;

  uv_check_stop(&check_handle);

  return scope.Close(Undefined());
}


/*
 * Initialization and registration of methods with node.
 */
void init(Handle<Object> target) {
  memset(&uv_run_stats, 0, sizeof(uv_run_stats));
  
  /* set up uv_run callback */
  uv_check_init(uv_default_loop(), &check_handle);
  uv_check_start(&check_handle, check_cb);
  
  NODE_SET_METHOD(target, "getData", getData);
  NODE_SET_METHOD(target, "stop", stop);
}

NODE_MODULE(uvmon, init);
