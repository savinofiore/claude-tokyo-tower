import { CITY_DEFS, farCity, nearCity, neon } from './city'
import { RAILWAY_DEFS, railway } from './railway'
import { clouds, fuji, moon, SKY_DEFS, sky, stars } from './sky'
import { DECK_Y, tower, TOWER_DEFS, TOWER_X } from './tower'

const STYLE = `<style>
@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}
.tw1{animation:tw 5.3s ease-in-out infinite}
.tw2{animation:tw 7.7s ease-in-out -2.5s infinite}
.tw3{animation:tw 10.1s ease-in-out -6s infinite}
.sp1{animation:tw 3.3s ease-in-out infinite}
.sp2{animation:tw 4.1s ease-in-out -1.4s infinite}
.sp3{animation:tw 5.6s ease-in-out -3s infinite}
@keyframes bk{0%{opacity:1}50%{opacity:.15}}
.bk{animation:bk 2.4s steps(1) infinite}
.bk2{animation:bk 3.2s steps(1) -1.1s infinite}
@keyframes fl{0%,44%,56%,100%{opacity:1}50%{opacity:.2}}
.fl{animation:fl 9s ease-in-out infinite}
@keyframes nb{0%,100%{opacity:1}50%{opacity:.78}}
.nb0{animation:nb 5s ease-in-out infinite}
.nb1{animation:nb 6.5s ease-in-out -3s infinite}
@keyframes tr{0%{transform:translateX(-600px)}70%,100%{transform:translateX(1400px)}}
.tr{animation:tr 36s linear infinite}
@keyframes cl{0%{transform:translateX(-40px)}100%{transform:translateX(40px)}}
.cl{animation:cl 90s ease-in-out infinite alternate}
@keyframes bm{0%{transform:rotate(-16deg)}100%{transform:rotate(16deg)}}
.bm{transform-box:view-box;transform-origin:${TOWER_X}px ${DECK_Y}px;animation:bm 18s ease-in-out infinite alternate}
.bm2{animation-direction:alternate-reverse}
</style>`

const DEFS = `<defs>${SKY_DEFS}${TOWER_DEFS}${CITY_DEFS}${RAILWAY_DEFS}</defs>`

// xMaxYMax slice: a tall phone keeps the tower (right), a wide window keeps the street (bottom).
export const buildScene = (level: number) => {
  const near = nearCity(level)

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="xMaxYMax slice">' +
    STYLE +
    DEFS +
    sky(level) +
    stars(level) +
    moon() +
    clouds(level) +
    fuji() +
    farCity(level) +
    tower(level) +
    near.svg +
    neon(level, near.tall) +
    railway() +
    '</svg>'
  )
}
