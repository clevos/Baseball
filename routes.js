// the require keyword is built in node.js which tells node which packages it wants to use. 
// Express is a back end web application framework with Node.js
const express = require('express')
//Express body-parser is used to process data sent in an HTTP request body
const bodyParser = require('body-parser')
//Routing refers to how an application responds to client request for an endpoint
const router = express.Router()
// node needs to communicate with the mysql database
const mysql = require('mysql2/promise')
// file system package is needed to serve web assets(files ex:css,img)
const fs = require('fs')
// node requires the pug module for compiling HTML templates 
const { compile } = require('pug')
//router must use bodyParser to encode and decode the request
router.use(bodyParser.urlencoded({
    extended: true
}));

// declared a function to get an SQL connection
// async is required by javascript because of the await
async function getMySQLConnection() {
  // I am calling mysql to get a connection and must wait to establish the  connection
   //localhost uses IP address 127.0.0.1
   // lines 25 through 30 json
    const connection = await mysql.createConnection(
      {
        host: 'localhost',
        user: 'baseball',
        password: 'Test',
        database: 'baselmlk_baseball'
      }
    )
    return connection
}
// router.use means when the router is used invoke this function
//Router is used whenever the client requests an endpoint
//next is used to invoke the next function defined to the router
// This will be the requested endpoint
//=> defines a arrow function
//req.query provides access to query parameters in the url in JSON 
router.use((req, res, next) => {
    console.log('Hello from router',req.path,req.query)
    next()
})
// A put is a http method to store or process data from the client. I don't need a put because this application doesn't process client data
// get is the http method to retrieve a specified resource which is specified in '/'
router.get('/', (req, res) => {
  // http response code 200 means resource was successful found
    res.status(200).send('Welcome to Baseball Salaries.').end()
})
router.get('/charles', (req, res) =>{
  res.status(200).send("hi Charles").end()
})
//It sets up an endpoint using the http get method
// An arrow function (=>) is a block of code that is executed when the user requests something from the server
router.get('/averageTeamSalariesPerYear', (req, res) => {
    let yearID
    //This endpoint requires the yearID for its query
    // This if statement is true when the yearID query parameter is present in the request
    // yearID is attribute and req.query is the object 
    if (req.query['yearID']) {
      // get the yearID attribute and store it in the yearID variable
        yearID = req.query['yearID']
    }
    // Determines which column to sort by
    // By default sort by teamID
    let sortColumn='teamID'
    // sortColumn is the attribute and req.query is object
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    // Determines the sort order
    // By default sort in ascending
    let sortOrder ='asc'
    // sortColumn is the attribute and req.query is the object
    if(req.query['sortOrder']){
        sortOrder =req.query['sortOrder']
    }
    // async is used here because I have to wait for the database connection
    (async () => {
      // Defining a connection and waitng for the database connection
        const connection = await getMySQLConnection()
        // try block deals with code that may fail
        try {
          //All database commands will occur within a transaction
            await connection.beginTransaction()
            // Get list of all avaiable years to the variable results
            let results = await connection.query('Select distinct yearID From payroll order By yearID')
            // Defining variable years and bind it to the first position in the results array
            const years = results[0]
            let salaries
            //If the yearID exist AND the yearID >0
            //&& combines two boolean expressions
            //+ converts yearID to a number data type
            if (yearID && +yearID > 0) {
              //get the teamID and total salary, average salary from mySQL 
                results = await connection.query(`Select teamID, cast(sum(salary) as double) as total_sal, cast(avg(salary) as double) as avg_sal From payroll Where yearID = ${yearID} group by teamID order by ${sortColumn} ${sortOrder}`)
               // taking the results first and binding it to salaries variable
                salaries = results[0]
            }
            // Prepare response for the user
            // Provide data from the database in the response in JSON
            //Response renders HTML using the pug file and JSON data
            res.render('averageTeamSalariesPerYear', {  
                "yearID": yearID,
                "years": years,
                "salaries": salaries,
                "sortOrder": sortOrder
            })
            //catch deals with the error that may or may not hae occured
            // Cannot have a catch without a try
            //error is a json object containing details about the error
        } catch (error) {
        // console.log shows up in the terminal in node
            console.log(error)
            // We use the response object and we send the 500 to the client which is Internal Server Error
            //Internal Server Error means no additional information to send. Additional details are logged to the terminal
            res.status(500).json({
                "statuscode": 500,
                "message": "error occurred"
            })
            //finally is a block of code that is guaranteed to run after the try catch
        } finally {
          // closes connection to the database 
            connection.end();
        }
        //Final javascript catch for any error that occurs
    })().catch(err => console.error(err.stack))
})

router.get('/teamPayrollPerWinPerYear', (req, res) => {
    let yearID
    if (req.query['yearID']) {
        yearID = req.query['yearID']
    };
    let sortColumn ='teamID'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder=req.query['sortOrder']
    }
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('Select distinct yearID From payroll order By yearID')
            const years = results[0]
            let salaries
            if (yearID && +yearID > 0) {
                results = await connection.query(`Select teamID, w as won, cast(sum(salary) as double) as total_sal, cast(sum(salary)/w as double) as cost_per_win from payroll join teams using(teamID,yearID) where payroll.yearID= ${yearID} group by payroll.teamID, w order by ${sortColumn} ${sortOrder}`)
                salaries = results[0]
            }
            res.render('teamPayrollPerWinPerYear', {
                "yearID": yearID,
                "years": years,
                "salaries": salaries,
                "sortOrder": sortOrder
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "statuscode": 500,
                "message": "error occurred"
            })
        } finally {
            connection.end();
        }
    })().catch(err => console.error(err.stack))
})

router.get('/salariesPerTeamPerYear', (req, res) => {
    let yearID
    let teamID
    if (req.query['yearID']) {
        yearID = req.query['yearID']
    }
    if (req.query['teamID']) {
        teamID = req.query['teamID']
    };
    let sortColumn ='salary'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder=req.query['sortOrder']
    }
    (async () => {
        const connection = await getMySQLConnection()
        try {
            await connection.beginTransaction()
            let results = await connection.query('select distinct yearID from payroll where yearID > 0 order by yearID')
            const years = results[0]
            let teams
            if (yearID && +yearID > 0) {
                results = await connection.query(`select distinct teamID From payroll where yearID = ${yearID} order By teamID`)
                teams = results[0]
            }
            // need to execute query for players salaries 
            let salaries
            if (teamID && teamID !== 'none') {
                results = await connection.query(`select nameFirst as fname, nameLast as lname, salary
                From people join payroll on people.playerID=payroll.playerID
                where yearID=${yearID} and teamID ='${teamID}'
                order by ${sortColumn} ${sortOrder}`)
                salaries = results[0]
            }

            // need to render the HTML template
            res.render('salariesPerTeamPerYear', {
                "yearID": yearID,
                "teamID": teamID,
                "years": years,
                "teams": teams,
                "salaries":salaries,
                "sortOrder": sortOrder
            })
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "status_message": "internal server error"
            })
        } finally {
            connection.end()
        }
    })().catch(err => console.error(err.stack))
})
router.get('/highestPaidPlayersPerTeamPerYear',(req,res) => {
    let yearID 
    if(req.query['yearID']){
        yearID = req.query['yearID']
    }
    let sortColumn ='teamID'
    if(req.query['sortColumn']){
        sortColumn=req.query['sortColumn']
    }
    let sortOrder ='asc'
    if(req.query['sortOrder']){
        sortOrder=req.query['sortOrder']
    }
    ;(async() =>{
        const connection = await getMySQLConnection()
        try {
          await connection.beginTransaction()
          let results =await connection.query(`select distinct yearID from payroll where yearID >0 Order By yearID`)
          const years = results[0]
          // Need to execute the query to select highest paid players
          let salaries
          if(yearID && +yearID>0){
              results=await connection.query(`select teamID,nameFirst as fname,nameLast as lname,salary from people Join payroll s on people.playerID =s.playerID
              where yearID= ${yearID} and salary =(select max(salary) from payroll where yearID=s.yearID and teamID =s.teamID) Order by ${sortColumn} ${sortOrder}`)
            salaries = results[0]
            
            }
          // Need to render the pug template
          res.render('highestPaidPlayersPerTeamPerYear',{"yearID": yearID,"years":years,"salaries":salaries,"sortOrder": sortOrder})
        } catch (error) {
            console.log(error)
            res.status(500).json({
                "status_message": "internal server error"
            })
        }
    })().catch(err => console.error(err.stack))
})


router.get('/graphAverageTeamSalariesPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let teams
      let salaries
      if(yearID && +yearID>0){
        let results =await connection.query(`select teamID, cast(avg(salary) as double) as avg_sal From payroll Where yearID=${yearID} group By teamID order By teamID`)
        teams =results[0].map(t => t.teamID)
        salaries =results[0].map(t => t.avg_sal)
      }
      res.render('graph',{
        "title": `Average Team Salaries For ${yearID}`,
        "labels": teams,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})

router.get('/graphTeamPayrollPerWinPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let teams
      let salaries
      if(yearID && +yearID>0){
        let results =await connection.query(`select payroll.teamID, cast(sum(salary) /w as double) as cost_per_win From payroll join teams using (teamID,yearID) Where payroll.yearID=${yearID} group By payroll.teamID Order By teamID`)
        teams =results[0].map(t => t.teamID)
        salaries =results[0].map(t => t.cost_per_win)
      }
      res.render('graph',{
        "title": ` Team Payroll Per Win For ${yearID}`,
        "labels": teams,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})
router.get('/graphHighestPaidPlayersPerTeamPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let players
      let salaries
      if(yearID && +yearID>0){
        let results =await connection.query(`select teamID,nameFirst as fname,nameLast as lname,salary From people p join payroll s On p.playerID=s.playerID Where YearID =${yearID} and salary=(select max(salary) From payroll Where yearID=s.yearID and teamID=s.teamID) Order By teamID`)
        players =results[0].map(t => `${t.fname} ${t.lname} (${t.teamID})`)
        salaries =results[0].map(t => t.salary)
      }
      res.render('graph',{
        "title": ` Highest Paid Players Per Team For ${yearID}`,
        "labels": players,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})

router.get('/graphSalariesPerTeamPerYear',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  let teamID
  if(req.query['teamID']){
    teamID =req.query['teamID']
  }
  ;(async() => {
    const connection =await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let players
      let salaries
      if(teamID && teamID!=='NONE'){
        let results =await connection.query(`select nameFirst as fname,nameLast as lname,salary From people Join payroll On people.playerID=payroll.playerID Where yearID=${yearID} and teamID='${teamID}' Order By lName`)
        players =results[0].map(t => `${t.fname} ${t.lname}`)
        salaries =results[0].map(t => t.salary)
      }
      res.render('graph',{
        "title": ` PayRoll Data For ${teamID} For ${yearID}`,
        "labels": players,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({
        "status_message": "internal server error"
    })
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})
router.get('/playerSalaryOverTime',(req,res) => {
  let yearID 
  if(req.query['yearID']){
    yearID=req.query['yearID']
  }
  let playerID 
  if(req.query['playerID']){
    playerID=req.query['playerID']
  }
  let sortColumn='yearID'
  if(req.query['sortColumn']){
      sortColumn=req.query['sortColumn']
  }
  let sortOrder ='asc'
  if(req.query['sortOrder']){
      sortOrder =req.query['sortOrder']
  }
  ; (async () => {
    const connection = await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let results = await connection.query('select distinct yearID from teams where yearID between 1985 and 2016 order by 1')
      const years= results[0]
      let players
      if(yearID && +yearID > 0){
        results = await connection.query(`select playerID, nameFirst, nameLast, teamID, yearID, salary
          from people join payroll using(playerID) where yearID = ${yearID} order by salary desc limit 20`)
        players =results[0]
      }
      let salaries
      if(playerID){
        results = await connection.query(`select * from payroll where playerID = '${playerID}' order by ${sortColumn} ${sortOrder}`)
        salaries =results[0]
      }
      res.render('playersalaryovertime', { "yearID": yearID, "years": years, "playerID": playerID, "players": players, "salaries": salaries, "sortOrder": sortOrder })
    }catch(err){
      console.log(err)
      res.status(500).json({ "status_message": "internal server error"})
    
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})

router.get('/graphPlayerSalaryOverTime', (req,res) => {
  let playerID 
  if(req.query['playerID']){
    playerID=req.query['playerID']
  }

  ;(async () =>{
    const connection = await getMySQLConnection()
    try{
      await connection.beginTransaction()
      let years
      let salaries
      let playerName
      if(playerID){
        let results = await connection.query(`select concat(nameFirst,' ',nameLast) as playerName,yearID,teamID,salary from people join payroll using (playerID) where payroll.playerID= '${playerID}' order by yearID`)
        playerName= results[0][0]['playerName']
        years = results[0].map(t => `${t.yearID} (${t.teamID})`)
        salaries = results[0].map(t => t.salary)
      }
      res.render('graph', {
        "title": `Player Salary Over Time for ${playerName}`,
        "labels": years,
        "data": salaries
      })
    }catch(err){
      console.log(err)
      res.status(500).json({ "status_message": "internal server error"})
    
    }finally{
      connection.end()
    }
  })().catch(err => console.error(err.stack))
})
module.exports = router