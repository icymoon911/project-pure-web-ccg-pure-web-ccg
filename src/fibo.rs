// lib.rs
#[no_mangle]
pub extern "C" fn fib(n: i32) -> i64 {
    if n <= 1 {
        return n as i64;
    }
    
    let mut a = 0i64;
    let mut b = 1i64;
    
    for _ in 1..n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    
    b
}
