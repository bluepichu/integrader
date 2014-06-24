![Integrader](https://raw.githubusercontent.com/bluepichu/integrader/master/public/images/logo-light.png)

## Description

Integrader is a project created to provide students and teachers with a streamlined method of completing and grading basic assignment types.  Grading can be tedious for teachers, and working on paper can be tedious for students; this solves both problems by allowing students to use the internet and by automating the grading system.

## Installation

### Requirements

Integrader requires Node.js and MongoDB to run.  It has only been tested with Node.js v.0.10.29 and MongoDB Standard 2.6.

### Running

To run Integrader, follow these steps:

1. Clone the repository.
2. Navigate to `/server`.
3. Install the following Node packages:
  - utils
  - seedrandom
  - mongoose
  - mongojs
  - mathjs
4. Run `mongod` to start the MongoDB database.
5. Run `node server/serv.js` to begin integrader.  This will open integrader `localhost:1337`.

## Release Notes

**Version 0.1**: Stable for student login only.  Course and assignment creation must be done by hand directly into the database.
