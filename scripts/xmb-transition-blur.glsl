//!PARAM xmb_strength
//!DESC XMB transition blur strength (0 = off, 1 = base, higher = stronger)
//!TYPE DYNAMIC float
//!MINIMUM 0.0
//!MAXIMUM 8.0
0.0

//!HOOK MAIN
//!BIND HOOKED
//!DESC XMB blur - horizontal Gaussian
vec4 hook() {
    vec4 c = 0.103154 * HOOKED_texOff(vec2(0.0, 0.0));
    c += 0.099978 * (HOOKED_texOff(vec2(-2.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(2.0 * xmb_strength, 0.0)));
    c += 0.091033 * (HOOKED_texOff(vec2(-4.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(4.0 * xmb_strength, 0.0)));
    c += 0.077861 * (HOOKED_texOff(vec2(-6.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(6.0 * xmb_strength, 0.0)));
    c += 0.062564 * (HOOKED_texOff(vec2(-8.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(8.0 * xmb_strength, 0.0)));
    c += 0.047226 * (HOOKED_texOff(vec2(-10.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(10.0 * xmb_strength, 0.0)));
    c += 0.033494 * (HOOKED_texOff(vec2(-12.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(12.0 * xmb_strength, 0.0)));
    c += 0.022310 * (HOOKED_texOff(vec2(-14.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(14.0 * xmb_strength, 0.0)));
    c += 0.013957 * (HOOKED_texOff(vec2(-16.0 * xmb_strength, 0.0)) + HOOKED_texOff(vec2(16.0 * xmb_strength, 0.0)));
    return c;
}

//!HOOK MAIN
//!BIND HOOKED
//!DESC XMB blur - vertical Gaussian
vec4 hook() {
    vec4 c = 0.103154 * HOOKED_texOff(vec2(0.0, 0.0));
    c += 0.099978 * (HOOKED_texOff(vec2(0.0, -2.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 2.0 * xmb_strength)));
    c += 0.091033 * (HOOKED_texOff(vec2(0.0, -4.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 4.0 * xmb_strength)));
    c += 0.077861 * (HOOKED_texOff(vec2(0.0, -6.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 6.0 * xmb_strength)));
    c += 0.062564 * (HOOKED_texOff(vec2(0.0, -8.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 8.0 * xmb_strength)));
    c += 0.047226 * (HOOKED_texOff(vec2(0.0, -10.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 10.0 * xmb_strength)));
    c += 0.033494 * (HOOKED_texOff(vec2(0.0, -12.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 12.0 * xmb_strength)));
    c += 0.022310 * (HOOKED_texOff(vec2(0.0, -14.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 14.0 * xmb_strength)));
    c += 0.013957 * (HOOKED_texOff(vec2(0.0, -16.0 * xmb_strength)) + HOOKED_texOff(vec2(0.0, 16.0 * xmb_strength)));
    return c;
}
