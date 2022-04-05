function sortData(url,sortColumn){
    const yearID =document.getElementById('yearID').value
    if(sortOrder === 'asc'){
        sortOrder ='desc'
    }else{
        sortOrder ='asc'
    }
    let route =`${url}?yearID=${yearID}&sortColumn=${sortColumn}&sortOrder=${sortOrder}`

    if(document.getElementById('teamID')){
        const teamID= document.getElementById('teamID').value
        route=route+`&teamID=${teamID}`
    }
    window.location.href=route
}