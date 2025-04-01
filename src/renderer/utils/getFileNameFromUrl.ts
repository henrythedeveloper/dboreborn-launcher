export const getFileNameFromUrl = (url: string): string => {
  // Create a new URL object
  const myURL = new URL(url);
  
  // Get the pathname part of the URL
  const pathname = myURL.pathname;
  
  // Return the file name from the pathname
  return pathname.split("/").pop() || '';
};