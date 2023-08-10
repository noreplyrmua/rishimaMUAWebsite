function expander(objectID){
    // alert("expander triggered");
    var allRows = document.querySelectorAll(".extra-information");
    var alldbRows = document.querySelectorAll(".db-table-row");
    var alliTags = document.querySelectorAll("#iTag")
    allRows.forEach((row)=>{
        if (objectID === row.getAttribute("id")){
            $(row).fadeToggle(400, "linear");
            $(".extra-info-cell").fadeToggle(400, "linear");

            //code to switch expand button
            alliTags.forEach((iTag)=>{
                if (objectID === $(iTag).attr("value")){
                    console.log("inside if statement for alliTags");
                    if ($(iTag).hasClass("fa-caret-down")){
                        $(iTag).removeClass("fa-caret-down");
                        $(iTag).addClass("fa-caret-up");
                    } else {
                        $(iTag).removeClass("fa-caret-up");
                        $(iTag).addClass("fa-caret-down");
                    }
                }
            });
            alldbRows.forEach((dbrow)=>{
                if (objectID === $(dbrow).attr("id")){
                    console.log("inside if statement for alldbrows");
                    if ($(dbrow).hasClass("change-bg-color-row")){
                        $(dbrow).removeClass("change-bg-color-row");
                    } else {
                        $(dbrow).addClass("change-bg-color-row");
                    }
                }
            });
        }
    });
}

function toggleExpandButton(iTag){
    console.log("inside toggle expand button function");
    if ((iTag).attr("class") === "fa-solid fa-caret-down"){
        (iTag).attr("class", "fa-solid fa-caret-up");
    }
    if ((iTag).attr("class") === "fa-solid fa-caret-up"){
        (iTag).attr("class", "fa-solid fa-caret-down");
    }
}