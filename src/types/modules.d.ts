// modules.d.ts

// Allow importing SCSS files in TypeScript
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Allow importing HTML files in TypeScript  
declare module '*.html' {
  const content: string;
  export default content;
}

// 7zip-bin module
declare module '7zip-bin' {
  const path7za: string;
  export { path7za };
}

// node-7z module
declare module 'node-7z' {
  function extractFull(archivePath: string, outputDir: string, options?: any): any;
  export default extractFull;
}