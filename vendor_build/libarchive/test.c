#import <stdint.h>
#import <inttypes.h>
#import <stdio.h>

/*
  This file is a test to see how emscripten handles int64_t types.
  When a callback is invoked with an int64_t, it splits it up into 2 parameters
  the leftmost param contains the low bits, the rightmost param contains the
  high bytes.

  When returning an int64_t, invoke `module.Runtime.setTempRet0(highBits)`
  to set the high bits, and then just return the low bits.

  See test.js for more info
*/

int accept_cb(int64_t thing, int64_t (*f)(int64_t)) {
  int64_t result = f(thing);
  printf("Accepted %" PRId64 " and got back %" PRId64 "\n", thing, result);
  return 5;
}

int64_t cb(int64_t x) {
  printf("callback got %" PRId64 "\n", x);
  return 0;
}

int main() {
  accept_cb(123, cb);
  return 0;
}
