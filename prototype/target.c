#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    int x = 10;
    int y = 20;
    int result = add(x, y);   /* breakpoint will land here */
    printf("result = %d\n", result);
    return 0;
}
