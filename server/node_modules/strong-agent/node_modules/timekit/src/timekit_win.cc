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
#include <windows.h>
#include "profiler.h"

using namespace v8;


static double filetimeToMicroseconds(FILETIME* ft) {
  ULARGE_INTEGER uli;
  uli.LowPart = ft->dwLowDateTime;
  uli.HighPart = ft->dwHighDateTime;

  return (double)(uli.QuadPart/10);
}


Handle<Value> Time(const Arguments& args) {
  HandleScope scope;

  FILETIME stime;
  GetSystemTimeAsFileTime(&stime);

  return scope.Close(Number::New(filetimeToMicroseconds(&stime)));
}


Handle<Value> Cputime(const Arguments& args) {
  HandleScope scope;

  HANDLE proc = GetCurrentProcess();

  FILETIME ctime;
  FILETIME etime;
  FILETIME ktime;
  FILETIME utime;
  int ret = GetProcessTimes(proc, &ctime, &etime, &ktime, &utime);
  if(!ret) {
    return scope.Close(Undefined());
  }

  return scope.Close(Number::New(filetimeToMicroseconds(&ktime) + filetimeToMicroseconds(&utime)));
}


void Init(Handle<Object> target) {
  target->Set(String::NewSymbol("time"), FunctionTemplate::New(Time)->GetFunction());
  target->Set(String::NewSymbol("cputime"), FunctionTemplate::New(Cputime)->GetFunction());
  target->Set(String::NewSymbol("startV8Profiler"), FunctionTemplate::New(StartV8Profiler)->GetFunction());
  target->Set(String::NewSymbol("stopV8Profiler"), FunctionTemplate::New(StopV8Profiler)->GetFunction());
}


NODE_MODULE(timekit, Init);

