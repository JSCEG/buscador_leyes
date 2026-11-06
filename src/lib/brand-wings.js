/**
 * Wings for the intro: a long blade and rows of sharp feathers, drawn once for the left side and
 * mirrored around x = 450 for the right. Every piece carries `--i`, its turn in the unfolding.
 */
const WIDTH = 900;
const ROOT_DIRECTION = [0.89, 0.46];
const BLADE = 'M14 22 C120 62 280 120 408 222 C270 176 130 104 14 22 Z';
// x, y of the sharp tip, length and thickness, from the wing's tip toward the body.
const FEATHERS = [
    [40, 58, 140, 18], [190, 150, 118, 18], [310, 212, 72, 16],
    [78, 108, 120, 16], [212, 190, 98, 16], [322, 248, 48, 13],
    [118, 156, 98, 14], [240, 232, 74, 13],
    [165, 205, 70, 12],
];

function featherPath([x, y, length, thickness]) {
    const [dx, dy] = ROOT_DIRECTION;
    const endX = x + length * dx;
    const endY = y + length * dy;
    const round = value => Math.round(value * 10) / 10;
    return `M${x} ${y} L${round(endX)} ${round(endY)} L${round(endX - 5)} ${round(endY + thickness)} Q${round(x + length * 0.35 * dx)} ${round(y + length * 0.35 * dy + thickness)} ${x} ${y} Z`;
}

function wing(blade, feather) {
    const pieces = FEATHERS.map((item, index) => `<path class="si-feather" style="--i:${index + 1}" d="${featherPath(item)}" fill="${feather}"/>`).join('');
    return `<g class="si-wing"><path class="si-feather si-blade" style="--i:0" d="${BLADE}" fill="${blade}"/>${pieces}</g>`;
}

export function wingsSvg({ blade = '#F6EFE6', feather = '#D0A94E', className = '' } = {}) {
    return `<svg class="${className}" viewBox="0 0 ${WIDTH} 360" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <g>${wing(blade, feather)}</g>
  <g transform="matrix(-1 0 0 1 ${WIDTH} 0)">${wing(blade, feather)}</g>
</svg>`;
}
