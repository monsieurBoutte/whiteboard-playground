# Whiteboard Playground

## Overview

Whiteboard Playground is an interactive project designed to explore the capabilities of state machines and the Canvas API for drawing and manipulating shapes on a virtual whiteboard. This project provides a dynamic environment for users to create, select, and modify shapes in a visually intuitive manner.

## Features

- **Draw Shapes**: Users can draw a variety of shapes on the whiteboard.
- **Select Shapes**: Allows for the selection of individual or multiple shapes to perform further actions.
- **Delete Shapes**: Users can delete selected shapes from the whiteboard.
- **Resize Shapes**: Provides functionality to resize selected shapes according to user preference.
- **Reposition Shapes**: Enables moving shapes around the whiteboard to organize or restructure content.

## Technologies

- **State Machines**: Utilized to manage the complex states of the application efficiently.
- **Canvas API**: Used for rendering and manipulating the graphical content on the whiteboard.

## Folder Structure

The project is organized into several key directories, each serving a specific purpose in the application architecture:

- **domain**: This directory contains all the types and constants used throughout the project. It serves as the central definition point for the data structures and fixed values.

- **application**: This folder houses the business logic of the application. It is responsible for handling the operations and rules that define the core functionalities of the Whiteboard Playground.

- **infrastructure**: Located here is the state machine logic. This directory is crucial for managing the various states of the application, ensuring smooth transitions and robust state handling.

- **ui**: This directory is where the React components are developed. These components leverage the definitions from the domain, the business logic from the application, and the state management provided by the infrastructure to build a cohesive and interactive user interface.

## Running locally

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the project running locally.
