//Things we can get from the data : -
//Total matches played
//Total centuries scored
//runs scored in a year
//centuries scored in a year
//half centuries scored in a year
//half centuries coverted into century
//nervous nineties
//score against the teams
//score in the winning cause
//bowling figures
//performance in close matches
//batting first performance
//moving average, longitudanal career growth
//1000 Runs in one calendar year
//batting second performance (while chasing)

//TODO:
//Get centuries by country
//Get centuries by year
//Get runs by country
//Get runs by year
//Get runs by winning
//Get runs by loosing
//Get centuries in winning cause



//NOTE: Once all data is collected clean out the callback hell :P
angular.module('app')
    .service('dataMutator', function($http) {
        return{
            getData: getData,
            csvToJSON: csvToJSON,
            getCareerStats: getCareerStats

        }

        function getData() {
            return $http.get('/data/sachin.csv')
        }

        function csvToJSON(csv, callback) {
            var lines=csv.split("\n");
            var result = [];
            var headers=lines[0].split(",");
            for(var i=1;i<lines.length -1;i++){
                var obj = {};
                var currentline=lines[i].split(",");
                for(var j=0;j<headers.length;j++){
                  obj[headers[j]] = currentline[j];
                }
                result.push(obj);
            }
            console.log(result)
            if(callback && (typeof callback === 'function')) {
                return callback(result);
            }
          return result;
        }

        function getCareerStats(data, callback) {
            var totalMatches = data.length;
            var totalRuns = 0;
            var centuriesScored = [];
            var halfCenturiesScored = [];
            var notOuts = 0;
            var didNotBat = 0;
            var wicketsTaken = 0;
            var runsConceded = 0;
            var catches = 0;
            angular.forEach(data, function(value) {
              var centuryDetail = {};
              var halfCenturyDetail = {};

              //Batting stats

              //check to see if the score contains a * in the end which dentoes NotOuts, if yes remove for calculations
              if(value.batting_score.indexOf("*") > -1){
                value.batting_score = value.batting_score.replace('*','');
                notOuts++;
              }
              //if the value of score is Not a number , it means it could be DNB(did not bat) or TDNB (team did not bat)
              if(isNaN(value.batting_score)){
                didNotBat++;
              }else{
                //Converting the string to integers to do calculations
                value.batting_score = parseInt(value.batting_score)
                //Checking to see if the score was a half century or century
                if(value.batting_score >= 50 && value.batting_score < 100){
                  halfCenturyDetail.runs = value.batting_score
                  halfCenturyDetail.against = value.opposition
                  halfCenturyDetail.result = value.match_result
                  halfCenturyDetail.year = value.date
                  halfCenturiesScored.push(halfCenturyDetail)
                }else if(value.batting_score >= 100){
                  centuryDetail.runs = value.batting_score
                  centuryDetail.against = value.opposition
                  centuryDetail.result = value.match_result
                  centuryDetail.year = value.date
                  centuriesScored.push(centuryDetail)
                }
                //Saving total runs
                totalRuns += value.batting_score;
              }

              //Bowling stats
              if(!isNaN(value.wickets) && parseInt(value.wickets) > 0){
                value.wickets = parseInt(value.wickets)
                wicketsTaken += value.wickets
              }
              if(!isNaN(value.catches) && parseInt(value.catches) > 0){
                value.catches = parseInt(value.catches)
                catches += value.catches
              }
              if(!isNaN(value.runs_conceded)){
                value.runs_conceded = parseInt(value.runs_conceded)
                runsConceded += value.runs_conceded;
              }
            });

          var totalInnings = totalMatches - didNotBat
          var stats = {
            totalMatches : totalMatches,
            totalRuns: totalRuns,
            halfCenturiesScored: halfCenturiesScored.length,
            centuriesScored: centuriesScored.length,
            highestScore:  Math.max.apply(null,centuriesScored.map(function(index){return index.runs})),
            notOuts: notOuts,
            totalInnings: totalInnings,
            battingAverage: (totalRuns / (totalInnings - notOuts)).toFixed(2),
            wicketsTaken: wicketsTaken,
            runsConceded: runsConceded,
            bowlingAverage: (runsConceded / wicketsTaken).toFixed(2),
            catches: catches
          };
          if(callback && (typeof callback === 'function')) {
              return callback(stats);
          }
          return stats
        }


    })
