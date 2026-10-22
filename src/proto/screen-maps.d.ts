// Every docs/games/<game>/screen-map.md, as text by game id (made by vite.config.ts at build time).
declare module 'virtual:screen-maps' {
  const maps: Record<string, string>;
  export default maps;
}
