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


#include "profiler.h"

using namespace v8;


static void Walk(int* next_uid, const int parent_uid, const CpuProfileNode* node, Local<Function> callback) {
  if(!node) return;

  int uid = (*next_uid)++;

  Handle<Value> argv[6];
  argv[0] = Integer::New(parent_uid);
  argv[1] = Integer::New(uid);
  argv[2] = Number::New(node->GetTotalSamplesCount()); 
  argv[3] = node->GetFunctionName();
  argv[4] = node->GetScriptResourceName();
  argv[5] = Integer::New(node->GetLineNumber()); 

  callback->Call(Context::GetCurrent()->Global(), 6, argv);

  int32_t childrenCount = node->GetChildrenCount();
  for(int i = 0; i < childrenCount; i++) {
    const CpuProfileNode* childNode = node->GetChild(i);
    Walk(next_uid, uid, childNode, callback);
  }
}


Handle<Value> StartV8Profiler(const Arguments& args) {
  HandleScope scope;

  CpuProfiler::StartProfiling(String::New("nodetime"));

  return scope.Close(Undefined());
}


Handle<Value> StopV8Profiler(const Arguments& args) {
  HandleScope scope;

  const CpuProfile* profile = CpuProfiler::StopProfiling(String::New("nodetime"));

  if(args.Length() > 0 && args[0]->IsFunction()) {
     Local<Function> callback = Local<Function>::Cast(args[0]);
     int nextUid = 1;
     Walk(&nextUid, 0, profile->GetTopDownRoot(), callback);
  }

  const_cast<v8::CpuProfile*>(profile)->Delete();

  return scope.Close(Undefined());
}

