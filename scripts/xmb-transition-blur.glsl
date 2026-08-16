//!HOOK MAIN
//!BIND HOOKED
//!DESC XMB Gaussian blur pass 1
vec4 hook(){vec4 c=4.0*HOOKED_texOff(vec2(0.0));c+=2.0*(HOOKED_texOff(vec2(-2,0))+HOOKED_texOff(vec2(2,0))+HOOKED_texOff(vec2(0,-2))+HOOKED_texOff(vec2(0,2)));c+=HOOKED_texOff(vec2(-2,-2))+HOOKED_texOff(vec2(2,-2))+HOOKED_texOff(vec2(-2,2))+HOOKED_texOff(vec2(2,2));return c/16.0;}
//!HOOK MAIN
//!BIND HOOKED
//!DESC XMB Gaussian blur pass 2
vec4 hook(){vec4 c=4.0*HOOKED_texOff(vec2(0.0));c+=2.0*(HOOKED_texOff(vec2(-2,0))+HOOKED_texOff(vec2(2,0))+HOOKED_texOff(vec2(0,-2))+HOOKED_texOff(vec2(0,2)));c+=HOOKED_texOff(vec2(-2,-2))+HOOKED_texOff(vec2(2,-2))+HOOKED_texOff(vec2(-2,2))+HOOKED_texOff(vec2(2,2));return c/16.0;}
