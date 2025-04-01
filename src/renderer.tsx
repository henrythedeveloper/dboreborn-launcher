import React from 'react';
import { createRoot } from 'react-dom/client';
import MainWindow from './renderer/components/MainWindow';
import './styles.scss';

// Get the root element from index.html
const container = document.getElementById('app');
if (!container) {
  throw new Error('No container element found');
}

// Create and render the React root with MainWindow component
const root = createRoot(container);
root.render(<MainWindow />);