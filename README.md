## Web Scrapper API | Ruby On Rails ![ROR](https://rubyonrails.org/images/rails-logo.svg)

This is a small application for experimentation with Ruby on Rails with sqllite DB. This application is able to scrap HTML tags from a web url and save it the database.

## API Description
1. POST /dumps - To scrap data from a website, just send a POST request to this API with address of url in the key of name url
data  = {url=http://www.example.com}

2. GET /dumps - To view list of all the data that the scapper has scapper till now, send a GET request to this API

3. GET/dumps?url=http/www.example.com - To view all the data scrapped for a particular website send a GET request to this API with url of the website in query params


## [Live demo here](http://decision-making.vishalranjan.in/)
[![Website](https://img.shields.io/website-up-down-green-red/http/shields.io.svg?maxAge=2592000)](http://decision-making.vishalranjan.in/) [![license](https://img.shields.io/github/license/mashape/apistatus.svg?maxAge=2592000)](http://mit-license.org/)


### Setup
* `git clone https://github.com/vishivish18/web-scrapper-api.git`
* Run `bundle install` from project directory
* Run `raisl s` to start project and the magic begins on `localhost:3000`

### Dependencies

* `ruby 2.6.3` 
* `rails 5.2.3`
* `nokogiri 1..6.8`


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

Copyright (c) 2019 Vishal Ranjan
