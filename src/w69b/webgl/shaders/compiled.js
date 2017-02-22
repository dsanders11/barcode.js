goog.provide('w69b.webgl.shaders.binarizeAvg1');
w69b.webgl.shaders.binarizeAvg1 = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'vec2 mirrorMargin = 1.0 / indim;\n' +
  'vec2 mirrorBorder = 1.0 - mirrorMargin;\n' +
  'void mirror(inout vec2 pos) {\n' +
  'pos = pos - step(mirrorBorder, pos) * (pos - mirrorBorder);\n' +
  'pos *= 2.0 * (0.5 - step(0.0, -pos));\n' +
  '}\n' +
  'uniform vec2 sampleDirection;\n' +
  'vec2 sampleStep = sampleDirection / indim;\n' +
  'void addSample(inout vec4 result, vec2 p, float offset, float weight) {\n' +
  'vec2 pos = (p + offset * sampleStep);\n' +
  'mirror(pos);\n' +
  'pos *= texscale;\n' +
  'vec4 color = texture2D(imageIn, pos);\n' +
  'float gray = (color.r + color.g + color.b) / 3.0;\n' +
  'result.r = min(result.r, gray);\n' +
  'result.g = max(result.g, gray);\n' +
  'result.b += gray * weight;\n' +
  '}\n' +
  'void gauss9(inout vec4 result, vec2 p) {\n' +
  'addSample(result, p, -4.0, 0.0459);\n' +
  'addSample(result, p, -3.0, 0.0822);\n' +
  'addSample(result, p, -2.0, 0.1247);\n' +
  'addSample(result, p, -1.0, 0.1601);\n' +
  'addSample(result, p, 0.0, 0.1741);\n' +
  'addSample(result, p, 1.0, 0.1601);\n' +
  'addSample(result, p, 2.0, 0.1247);\n' +
  'addSample(result, p, 3.0, 0.0822);\n' +
  'addSample(result, p, 4.0, 0.0459);\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = getNormalizedFragCoord() / dim;\n' +
  'vec4 result  = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  'gauss9(result, p);\n' +
  'gl_FragColor = result;\n' +
  '}';
goog.provide('w69b.webgl.shaders.binarizeGroup');
w69b.webgl.shaders.binarizeGroup = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'vec2 mirrorMargin = 1.0 / indim;\n' +
  'vec2 mirrorBorder = 1.0 - mirrorMargin;\n' +
  'void mirror(inout vec2 pos) {\n' +
  'pos = pos - step(mirrorBorder, pos) * (pos - mirrorBorder);\n' +
  'pos *= 2.0 * (0.5 - step(0.0, -pos));\n' +
  '}\n' +
  'uniform vec2 sampleDirection;\n' +
  'uniform vec2 outOffset;\n' +
  'uniform vec2 inOffset;\n' +
  'vec2 inOffsetNormalized = inOffset / texdim;\n' +
  'vec2 sampleStep = sampleDirection / indim;\n' +
  'void addSample(inout vec4 result, vec2 p, float offset, float weight) {\n' +
  'vec2 pos = (p + offset * sampleStep);\n' +
  'mirror(pos);\n' +
  'pos *= texscale;\n' +
  'pos += inOffsetNormalized;\n' +
  'vec4 color = texture2D(imageIn, pos);\n' +
  'result.r = min(result.r, color.r);\n' +
  'result.g = max(result.g, color.g);\n' +
  'result.b += color.b * weight;\n' +
  '}\n' +
  'void gauss9(inout vec4 result, vec2 p) {\n' +
  'addSample(result, p, -4.0, 0.0459);\n' +
  'addSample(result, p, -3.0, 0.0822);\n' +
  'addSample(result, p, -2.0, 0.1247);\n' +
  'addSample(result, p, -1.0, 0.1601);\n' +
  'addSample(result, p, 0.0, 0.1741);\n' +
  'addSample(result, p, 1.0, 0.1601);\n' +
  'addSample(result, p, 2.0, 0.1247);\n' +
  'addSample(result, p, 3.0, 0.0822);\n' +
  'addSample(result, p, 4.0, 0.0459);\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() - outOffset) / dim;\n' +
  'vec4 result  = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  'gauss9(result, p);\n' +
  '// //\n' +
  'gl_FragColor = result;\n' +
  '//\n' +
  '}';
goog.provide('w69b.webgl.shaders.debug');
w69b.webgl.shaders.debug = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'uniform vec2 outOffset;\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() - outOffset) / dim;\n' +
  'vec4 color = vec4(1.0);\n' +
  'color.rg = p;\n' +
  'gl_FragColor = color;\n' +
  '}';
goog.provide('w69b.webgl.shaders.dummy');
w69b.webgl.shaders.dummy = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'vec2 mirrorMargin = 1.0 / indim;\n' +
  'vec2 mirrorBorder = 1.0 - mirrorMargin;\n' +
  'void mirror(inout vec2 pos) {\n' +
  'pos = pos - step(mirrorBorder, pos) * (pos - mirrorBorder);\n' +
  'pos *= 2.0 * (0.5 - step(0.0, -pos));\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() / dim);\n' +
  'mirror(p);\n' +
  'p *= texscale;\n' +
  'gl_FragColor = texture2D(imageIn, p);\n' +
  '}';
goog.provide('w69b.webgl.shaders.estimateBlack');
w69b.webgl.shaders.estimateBlack = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'vec2 mirrorMargin = 1.0 / indim;\n' +
  'vec2 mirrorBorder = 1.0 - mirrorMargin;\n' +
  'void mirror(inout vec2 pos) {\n' +
  'pos = pos - step(mirrorBorder, pos) * (pos - mirrorBorder);\n' +
  'pos *= 2.0 * (0.5 - step(0.0, -pos));\n' +
  '}\n' +
  'vec4 sampleAt(vec2 pos, float scale) {\n' +
  'mirror(pos);\n' +
  'vec2 offset = scale * vec2(indim.x, 0) / texdim;\n' +
  'pos = pos * texscale + offset;\n' +
  'return texture2D(imageIn, pos);\n' +
  '}\n' +
  'float getDynRange(vec4 color) {\n' +
  'return color.g - color.r;\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = getNormalizedFragCoord() / dim;\n' +
  'vec4 color;\n' +
  'float minDynRange = 0.3;\n' +
  'color = sampleAt(p, 0.0);\n' +
  'if (getDynRange(color) < minDynRange) {\n' +
  'color = sampleAt(p, 1.0);\n' +
  'if (getDynRange(color) < minDynRange) {\n' +
  'color = sampleAt(p, 2.0);\n' +
  '}\n' +
  '}\n' +
  'color.z -= 0.02;\n' +
  'gl_FragColor = color;\n' +
  '}';
goog.provide('w69b.webgl.shaders.extractChannel');
w69b.webgl.shaders.extractChannel = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'uniform int channel;\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() / dim);\n' +
  'p *= texscale;\n' +
  'vec4 color = texture2D(imageIn, p);\n' +
  'float gray = color.b;\n' +
  'gl_FragColor = vec4(gray, gray, gray, 1.0);\n' +
  '}';
goog.provide('w69b.webgl.shaders.fragCoordTest');
w69b.webgl.shaders.fragCoordTest = 'precision mediump float;\n' +
  'void main() {\n' +
  'vec4 result = vec4(1.0);\n' +
  'result.rg = gl_FragCoord.xy / 10.0;\n' +
  'gl_FragColor = result;\n' +
  '}';
goog.provide('w69b.webgl.shaders.gaussBlur');
w69b.webgl.shaders.gaussBlur = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'vec2 mirrorMargin = 1.0 / indim;\n' +
  'vec2 mirrorBorder = 1.0 - mirrorMargin;\n' +
  'void mirror(inout vec2 pos) {\n' +
  'pos = pos - step(mirrorBorder, pos) * (pos - mirrorBorder);\n' +
  'pos *= 2.0 * (0.5 - step(0.0, -pos));\n' +
  '}\n' +
  'uniform vec2 sampleDirection;\n' +
  'uniform vec2 outOffset;\n' +
  'uniform vec2 inOffset;\n' +
  'vec2 sampleStep = sampleDirection / texdim;\n' +
  'vec2 inOffsetNormalized = inOffset / texdim;\n' +
  'void addSample(inout vec4 result, vec2 p, float offset, float weight) {\n' +
  'vec2 pos = (p + (offset * sampleStep));\n' +
  'mirror(pos);\n' +
  'pos *= texscale;\n' +
  'pos += inOffsetNormalized;\n' +
  'vec4 color = texture2D(imageIn, pos);\n' +
  'result.rgb += color.rgb * weight;\n' +
  '}\n' +
  'void gauss9(inout vec4 result, vec2 p) {\n' +
  'addSample(result, p, -4.0, 0.0459);\n' +
  'addSample(result, p, -3.0, 0.0822);\n' +
  'addSample(result, p, -2.0, 0.1247);\n' +
  'addSample(result, p, -1.0, 0.1601);\n' +
  'addSample(result, p, 0.0, 0.1741);\n' +
  'addSample(result, p, 1.0, 0.1601);\n' +
  'addSample(result, p, 2.0, 0.1247);\n' +
  'addSample(result, p, 3.0, 0.0822);\n' +
  'addSample(result, p, 4.0, 0.0459);\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() - outOffset) / dim;\n' +
  'vec4 result  = vec4(0.0, 0.0, 0.0, 1.0);\n' +
  'gauss9(result, p);\n' +
  'gl_FragColor = result;\n' +
  '}';
goog.provide('w69b.webgl.shaders.grayscale');
w69b.webgl.shaders.grayscale = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() / dim);\n' +
  'p *= texscale;\n' +
  'vec4 color = texture2D(imageIn, p);\n' +
  'float gray = (color.r + color.g + color.b) / 3.0;\n' +
  'gl_FragColor = vec4(gray, gray, gray, 1.0);\n' +
  '}';
goog.provide('w69b.webgl.shaders.rectVertex');
w69b.webgl.shaders.rectVertex = 'attribute vec2 position;\n' +
  'void main(void) {\n' +
  'gl_Position = vec4(position, 0, 1);\n' +
  '}';
goog.provide('w69b.webgl.shaders.scale');
w69b.webgl.shaders.scale = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'uniform float outOffsetX;\n' +
  'uniform float inOffsetX;\n' +
  'vec2 outOffset = vec2(outOffsetX, 0);\n' +
  'vec2 inOffset = vec2(inOffsetX, 0) / texdim;\n' +
  'vec2 stepX = vec2(0.7, 0) / indim;\n' +
  'vec2 stepY = vec2(0, 0.7) / indim;\n' +
  'vec2 scale = indim / dim;\n' +
  'vec3 combine(vec3 color1, vec3 color2) {\n' +
  'return vec3(\n' +
  'min(color1.x, color2.x),\n' +
  'max(color1.y, color2.y),\n' +
  'color1.z + color2.z);\n' +
  '}\n' +
  'vec3 sample(vec2 p, vec2 offset) {\n' +
  'vec2 pos = (p + offset);\n' +
  'pos = min(vec2(1.0, 1.0), pos);\n' +
  'pos = max(vec2(0.0, 0.0), pos);\n' +
  'pos = inOffset + texscale * pos;\n' +
  'return texture2D(imageIn, pos).xyz;\n' +
  '}\n' +
  'void main() {\n' +
  'vec2 p = (getNormalizedFragCoord() - outOffset) / dim;\n' +
  'vec3 result = sample(p, - stepX - stepY);\n' +
  'result = combine(result, sample(p, stepX + stepY));\n' +
  'result = combine(result, sample(p, stepX - stepY));\n' +
  'result = combine(result, sample(p, -stepX + stepY));\n' +
  'result.z /= 4.0;\n' +
  'gl_FragColor = vec4(result, 1.0);\n' +
  '}';
goog.provide('w69b.webgl.shaders.threshold');
w69b.webgl.shaders.threshold = 'precision mediump float;\n' +
  'uniform float width;\n' +
  'uniform float height;\n' +
  'uniform float inwidth;\n' +
  'uniform float inheight;\n' +
  'uniform float texwidth;\n' +
  'uniform float texheight;\n' +
  'uniform vec2 fragCoordOffset;\n' +
  'uniform sampler2D imageIn;\n' +
  'vec2 dim = vec2(width, height);\n' +
  'vec2 texdim = vec2(texwidth, texheight);\n' +
  'vec2 indim = vec2(inwidth, inheight);\n' +
  'vec2 texscale = indim / texdim;\n' +
  'vec2 getNormalizedFragCoord() {\n' +
  'return (gl_FragCoord.xy - fragCoordOffset) + 0.5;\n' +
  '}\n' +
  'uniform sampler2D origImage;\n' +
  'vec2 texscaleBlackLevels = indim / texdim;\n' +
  'void main() {\n' +
  'vec2 p = getNormalizedFragCoord() / dim;\n' +
  'vec4 color = texture2D(origImage, p);\n' +
  'float gray = (color.r + color.g + color.b) / 3.0;\n' +
  'float black = texture2D(imageIn, p * texscaleBlackLevels).z;\n' +
  'float binary = gray > black ? 1.0 : 0.0;\n' +
  'gl_FragColor = vec4(binary, binary, binary, 1.0);\n' +
  '}';