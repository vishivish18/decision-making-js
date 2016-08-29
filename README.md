## Decision Making With JS
A project to make sense out of a CSV data, analyze it, and then visualize it to help in decision making using Javascript


## [Live demo here](http://decision-making.vishalranjan.in/)
[![Website](https://img.shields.io/website-up-down-green-red/http/shields.io.svg?maxAge=2592000)](http://decision-making.vishalranjan.in/) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](http://mit-license.org/)


### Setup
* git clone `https://github.com/vishivish18/decision-making-js.git`
* Run `npm install` from project directory
* Run `gulp dev` to start project and the magic begins on `localhost:1805`

### Other gulp tasks

* Run `gulp js` to concat and minify all js in `app.built.js`
* Run `gulp css` to process Sass to Css in `app.css`


### Architecture

* It uses node to serve an angular app with MV* architecture
* All operations are done on this [data](http://decision-making.vishalranjan.in/data/sachin.csv) 
* The frontend fetches this data and the performs operations to turn it into something meaningful

### Tools Used
* gulp
* [tc-chart-js](http://carlcraig.github.io/tc-angular-chartjs/) An angular directive over Charts.js


### Contribution
Well this is kind of a learning project, feel free to fork it and happy hacking :)

### License
[MIT License](http://mit-license.org/)

Copyright (c) 2016 Vishal Ranjan
