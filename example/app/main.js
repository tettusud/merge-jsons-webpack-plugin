 
async function getContent(file) {
  return  fetch(file)
    .then(res=>res.json())
    .then(body=>{
        return JSON.stringify(body,undefined,4);
    })
}

onload = async () => {
    document.querySelector("span").innerHTML = `Current Time : ${ new Date().toLocaleTimeString()}`;
    const contentDiv =  document.querySelector("pre");
    contentDiv.append(await getContent("files/file.json"));
}



window.load = onload;