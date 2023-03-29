

var nodes = []
console.log(nodes)

class Node {

    container = document.getElementById("container");

    constructor(x, y, isFailed = false, color = "blue") {
        if (isFailed) {
            color = "red";
        }
        this.id = crypto.randomUUID();
        /* 
         * this.heart_rate range => 500ms to 2000ms
         * (random_gen * (max - min)) + min
         */
        this.heart_rate = (parseInt(Math.random() * (2000-500))) + 500;
        this.freq_rate = parseFloat(((1/this.heart_rate)*100).toFixed(3));
        this.x = parseInt(x);
        this.y = parseInt(y);
        this.color = color;
        this.isFailed = isFailed;
        this.range = 500; // portata dell'invio del messaggio
        this.children = [];
        this.probVal = parseFloat((1/(Math.random()*(20-10)+10)).toFixed(2));
        this.probMatrix = [[(1 - this.probVal).toFixed(2), this.probVal.toFixed(2)], [0, 1]];
        // this.comunication_data = {}
        this.other_nodes_data = {}
        this.other_nodes_data[this.id] = [this.isFailed, getDate()] // backup object for dead nodes
        this.listeners = {};
        this.create();
        this.updateNodesList()
        this.send_data();
        this.initNode();
    }

    addEventListener(eventName, callback) {
        if (!this.listeners[eventName]) {
          this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
      }
    
      removeEventListener(eventName, callback) {
        if (this.listeners[eventName]) {
          this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
        }
      }
    
      emit(eventName, data) {
        Object.values(nodes).forEach(node => {
          if (node.listeners[eventName]) {
            node.listeners[eventName].forEach(callback => callback(data));
          }
        });
      }

    set changeColor(color){
        this.color = color
    }

    set changeStatus(status) {
        this.isFailed = status;
        var this_nodo = document.querySelector(`div[data-id='${this.id}']`)
        if(this.isFailed){
            this.changeColor = "red"
            this_nodo.style.backgroundColor = "red";
        }
        else{
            this.changeColor = "blue"
            this_nodo.style.backgroundColor = "blue";
        }
    }

    initNode(){
        this.addEventListener(this.id, data => {
            // console.log(`Nodo: ${this.id}; data: ${data}`);
            for (let key in data) {
                if (key in this.other_nodes_data) {
                  if (data[key][1] < this.other_nodes_data[key][1]) {
                    this.other_nodes_data[key][0] = data[key][0]; // status
                  }
                } else {
                  this.other_nodes_data[key] = data[key];
                }
              }
          });
        // this.comunication_data = {id: this.id, date: getDate()}
    }

    create() {
        var el = document.createElement("div");
        el.classList.add("node");
        el.classList.add("running-node");
        el.style.left = `${this.x}px`;
        el.style.bottom = `${this.y}px`;
        el.setAttribute("data-id", this.id)
        container.appendChild(el)
        var circle = document.createElement("div");
        circle.classList.add("circle_range");
        circle.style.width = `${this.range}px`;      
        circle.style.height = `${this.range}px`;      
        circle.style.left = `${this.x}px`;      
        circle.style.bottom = `${this.y}px`;   
        el.setAttribute("data-node-id", this.id)
        container.appendChild(circle)
    }

    vis_send_data(){
        var this_nodo = document.querySelector(`div[data-id='${this.id}']`)
        this_nodo.style.backgroundColor = "#0f0";
        // var circle = document.createElement("div");
        // circle.classList.add("circle");      
        // circle.style.left = `${this.x}px`;      
        // circle.style.bottom = `${this.y}px`;      
        // container.appendChild(circle)
        // console.log(`X: ${this.x}; Y: ${this.y}; cerchio_left: ${circle.style.left}; cerchio_bottom: ${circle.style.bottom}; cerchio_top: ${circle.style.top}; cerchio_right: ${circle.style.right};`)
        
        // setTimeout(() => {
        //     document.getElementsByClassName("circle")[0].remove();
        //     document.getElementsByClassName("circle-border")[0].remove();
        // }, 2*1000)
      
        setTimeout(() => {
            this_nodo.style.backgroundColor = this.color;
        }, 500);
    }

    updateNodesList(){
        nodes.push(this);
    }


    toString() {
        return `X: ${this.x}; Y: ${this.y};`;
    }

    displayInfo(){
        
    }
    prepareData(){
        var dest_nodes = [] // nodi destinatari
        var index1 = Math.floor((Math.random() * 1000)%nodes.length);
        dest_nodes.push(nodes[index1]);

        var index2;
        var elemento2;

        do {
            index2 = Math.floor(Math.random() * nodes.length);
            elemento2 = nodes[index2];
        } while (index2 === index1);
        dest_nodes.push(elemento2);
        return dest_nodes;
    }
    
    async send_data(){
        var intervalID = setInterval(() => { 
            return new Promise(resolve => {
                resolve(() => {   
                    if(!(this.isFailed)){
                        if (eseguiConProb(this.probVal)){
                            this.vis_send_data();
                            /* send data */
                            this.prepareData().forEach((node_dest) => {
                                this.other_nodes_data[this.id][1] = getDate();
                                this.emit(node_dest.id, this.other_nodes_data);
                            })                        
                        }
                        else{
                            this.changeStatus = true;
                            console.log(`${this.id} fallito`);
                            clearInterval(intervalID);
                        }
                    }
                });
            }).then(callback => callback());
        }, this.heart_rate); 

    }
    /*
    async send_data() {
        if (!this.isFailed) {
            while (true) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, this.heart_rate);
                });
                await this.vis_send_data();
            }
        }
    }
    */

    async failTimer() {
        // randomTime range => 5000ms to 30_000ms
        const randomTime = (Math.random() * (30_000-5000)) + 5000;
        console.log(randomTime)

        return new Promise(resolve => {

            setTimeout(() => { 
                resolve(() => {
                    this.changeStatus = true;
                    console.log(`${this.id} fallito`)
                });
                
                // this.remove() 
            }, randomTime); 
        }).then(callback => callback()); // chiamata alla funzione restituita dalla promise;        
    }
}

// width_range = getComputedStyle(document.documentElement).getPropertyValue('--container-w')
// height_range = getComputedStyle(document.documentElement).getPropertyValue('--container-h')

for(i=0; i<5; i++){
    new Node((Math.random()*1190)+10, (Math.random()*890)+10)
}

console.log(nodes)
max_heartRate = nodes.map(node => node.heart_rate).reduce((a, b) => Math.max(a,b))
console.log(max_heartRate)
ordered_nodes = nodes.sort((a, b) => a.heart_rate - b.heart_rate);
console.log(ordered_nodes)

/*
ordered_nodes.forEach((node) => {
    console.log(`VAL: ${node.probVal}; Prob Matrix: ${node.probMatrix}`)
})
*/
filteredArray = ordered_nodes.map(({probVal, probMatrix}) => ({probVal, probMatrix: probMatrix.join(' - ')}))
console.table(filteredArray)

function eseguiConProb(failPRob) {
    return !(Math.random() <= failPRob);
    /*
    if (Math.random() <= failPRob) {
        // Esegui la funzione
        console.log("La funzione è stata eseguita con successo.");
    } else {
        // Non eseguire la funzione
        console.log("La funzione non è stata eseguita.");
    }
    */
}

function getDate(){
    let date = new Date();
    let day = String(date.getDay()).padStart(2, '0')
    let month = String(date.getMonth()).padStart(2, '0')
    let hours = String(date.getHours()).padStart(2, '0')
    let minutes = String(date.getMinutes()).padStart(2, '0')
    let seconds = String(date.getSeconds()).padStart(2, '0')
    return date
}

genForm = document.getElementById("new-values");
genForm.addEventListener("submit", (event) => {
    event.preventDefault();
    /*
    container = document.getElementById("container");
    container.remove();
    newContainer = document.createElement("div");
    newContainer.setAttribute("id", "container");
    document.body.insertBefore(newContainer, genForm);
    nodes.forEach((node) => {
        delete node;
    })
    nodes = []
    nInput = document.getElementById("n");
    setTimeout(() => {
        for(i=0; i<parseInt(nInput.value); i++){
            new Node((Math.random()*1190)+10, (Math.random()*890)+10)
        }
    }, 1000)
    */
});

