'use strict';
// 후처리: 블룸 · 틸트시프트 · 색보정

// ===================================================================
// 후처리: 블룸 + 틸트시프트 + 색보정
// ===================================================================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.88);
composer.addPass(bloom);
const gradePass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2() }, uFocus: { value: 0.45 }, uBlur: { value: 5 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uFocus; uniform float uBlur; varying vec2 vUv;
    void main(){
      float d = abs(vUv.y - uFocus);
      float r = smoothstep(0.1, 0.5, d) * uBlur;
      vec3 col;
      if (r < 0.3) col = texture2D(tDiffuse, vUv).rgb;
      else {
        col = vec3(0.0);
        for (int i = 0; i < 20; i++) {
          float a = float(i) * 2.39996; float rr = sqrt(float(i) + 0.5) / sqrt(20.0);
          col += texture2D(tDiffuse, vUv + vec2(cos(a), sin(a)) * rr * r / uRes).rgb;
        }
        col /= 20.0;
      }
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col *= mix(vec3(0.86, 0.9, 1.16), vec3(1.1, 1.0, 0.86), smoothstep(0.0, 0.5, l));
      col = mix(vec3(l), col, 1.12);
      vec2 q = vUv - 0.5; col *= 1.0 - dot(q, q) * 0.95;
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(gradePass);
composer.addPass(new OutputPass());

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  gradePass.uniforms.uRes.value.set(innerWidth * PR, innerHeight * PR);
  gradePass.uniforms.uBlur.value = 5 * PR;
  const sc = innerHeight * PR / (2 * Math.tan(camera.fov * Math.PI / 360));
  glow.mat.uniforms.uScale.value = sc * 0.6; soft.mat.uniforms.uScale.value = sc * 0.6;
  hud.width = innerWidth * PR; hud.height = innerHeight * PR;
}
const hud = document.getElementById('hud'), hctx = hud.getContext('2d');
addEventListener('resize', resize); resize();
