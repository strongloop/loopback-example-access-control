/*
 * Copyright (c) 2012 Dmitri Melikyan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the 
 * "Software"), to deal in the Software without restriction, including 
 * without limitation the rights to use, copy, modify, merge, publish, 
 * distribute, sublicense, and/or sell copies of the Software, and to permit 
 * persons to whom the Software is furnished to do so, subject to the 
 * following conditions:
 * 
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN 
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR 
 * THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


#include <node.h>
#include <v8.h>
#include <sys/resource.h>
#include <sys/time.h>
#include <errno.h>
#include "profiler.h"

using namespace v8;


Handle<Value> Time(const Arguments& args) {
  HandleScope scope;

  timeval tv;

  int ret = gettimeofday(&tv, 0);
  if (ret < 0) {
    return scope.Close(Undefined());
  }

  return scope.Close(Number::New((double)tv.tv_sec * 1e6 + (double)tv.tv_usec));
}


Handle<Value> Cputime(const Arguments& args) {
  HandleScope scope;

  struct rusage ru;

  int ret = getrusage(RUSAGE_SELF, &ru);
  if (ret < 0) {
    return scope.Close(Undefined());
  }

  return scope.Close(Number::New((double)ru.ru_utime.tv_sec * 1e6 + (double)ru.ru_utime.tv_usec + (double)ru.ru_stime.tv_sec * 1e6 + (double)ru.ru_stime.tv_usec));
}


void Init(Handle<Object> target) {
  target->Set(String::NewSymbol("time"), FunctionTemplate::New(Time)->GetFunction());
  target->Set(String::NewSymbol("cputime"), FunctionTemplate::New(Cputime)->GetFunction());
  target->Set(String::NewSymbol("startV8Profiler"), FunctionTemplate::New(StartV8Profiler)->GetFunction());
  target->Set(String::NewSymbol("stopV8Profiler"), FunctionTemplate::New(StopV8Profiler)->GetFunction());
}


NODE_MODULE(timekit, Init);

