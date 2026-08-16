//!HOOK MAIN
//!BIND HOOKED
//!DESC XMB transition blur - horizontal Gaussian
vec4 hook(){
    vec4 c = 0.0648930 * HOOKED_texOff(vec2(0.0, 0.0));
    c += 0.0641300 * (HOOKED_texOff(vec2(-1.0, 0.0)) + HOOKED_texOff(vec2(1.0, 0.0)));
    c += 0.0618930 * (HOOKED_texOff(vec2(-2.0, 0.0)) + HOOKED_texOff(vec2(2.0, 0.0)));
    c += 0.0583370 * (HOOKED_texOff(vec2(-3.0, 0.0)) + HOOKED_texOff(vec2(3.0, 0.0)));
    c += 0.0536980 * (HOOKED_texOff(vec2(-4.0, 0.0)) + HOOKED_texOff(vec2(4.0, 0.0)));
    c += 0.0482760 * (HOOKED_texOff(vec2(-5.0, 0.0)) + HOOKED_texOff(vec2(5.0, 0.0)));
    c += 0.0423920 * (HOOKED_texOff(vec2(-6.0, 0.0)) + HOOKED_texOff(vec2(6.0, 0.0)));
    c += 0.0363400 * (HOOKED_texOff(vec2(-7.0, 0.0)) + HOOKED_texOff(vec2(7.0, 0.0)));
    c += 0.0304280 * (HOOKED_texOff(vec2(-8.0, 0.0)) + HOOKED_texOff(vec2(8.0, 0.0)));
    c += 0.0248850 * (HOOKED_texOff(vec2(-9.0, 0.0)) + HOOKED_texOff(vec2(9.0, 0.0)));
    c += 0.0198730 * (HOOKED_texOff(vec2(-10.0, 0.0)) + HOOKED_texOff(vec2(10.0, 0.0)));
    c += 0.0155010 * (HOOKED_texOff(vec2(-11.0, 0.0)) + HOOKED_texOff(vec2(11.0, 0.0)));
    c += 0.0118010 * (HOOKED_texOff(vec2(-12.0, 0.0)) + HOOKED_texOff(vec2(12.0, 0.0)));
    return c;
}
//!HOOK MAIN
//!BIND HOOKED
//!DESC XMB transition blur - vertical Gaussian
vec4 hook(){
    vec4 c = 0.0648930 * HOOKED_texOff(vec2(0.0, 0.0));
    c += 0.0641300 * (HOOKED_texOff(vec2(0.0, -1.0)) + HOOKED_texOff(vec2(0.0, 1.0)));
    c += 0.0618930 * (HOOKED_texOff(vec2(0.0, -2.0)) + HOOKED_texOff(vec2(0.0, 2.0)));
    c += 0.0583370 * (HOOKED_texOff(vec2(0.0, -3.0)) + HOOKED_texOff(vec2(0.0, 3.0)));
    c += 0.0536980 * (HOOKED_texOff(vec2(0.0, -4.0)) + HOOKED_texOff(vec2(0.0, 4.0)));
    c += 0.0482760 * (HOOKED_texOff(vec2(0.0, -5.0)) + HOOKED_texOff(vec2(0.0, 5.0)));
    c += 0.0423920 * (HOOKED_texOff(vec2(0.0, -6.0)) + HOOKED_texOff(vec2(0.0, 6.0)));
    c += 0.0363400 * (HOOKED_texOff(vec2(0.0, -7.0)) + HOOKED_texOff(vec2(0.0, 7.0)));
    c += 0.0304280 * (HOOKED_texOff(vec2(0.0, -8.0)) + HOOKED_texOff(vec2(0.0, 8.0)));
    c += 0.0248850 * (HOOKED_texOff(vec2(0.0, -9.0)) + HOOKED_texOff(vec2(0.0, 9.0)));
    c += 0.0198730 * (HOOKED_texOff(vec2(0.0, -10.0)) + HOOKED_texOff(vec2(0.0, 10.0)));
    c += 0.0155010 * (HOOKED_texOff(vec2(0.0, -11.0)) + HOOKED_texOff(vec2(0.0, 11.0)));
    c += 0.0118010 * (HOOKED_texOff(vec2(0.0, -12.0)) + HOOKED_texOff(vec2(0.0, 12.0)));
    return c;
}
