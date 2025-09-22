// Canvas setup (unchanged)
const mazeCanvas = document.getElementById('mazeCanvas');
const ctx = mazeCanvas.getContext('2d');

const redCanvas = document.getElementById('redView');
const redCtx = redCanvas.getContext('2d');

const blueCanvas = document.getElementById('blueView');
const blueCtx = blueCanvas.getContext('2d');

const mapCanvas = document.getElementById('mapView');
const mapCtx = mapCanvas.getContext('2d');

const pathCanvas = document.getElementById('pathView');
const pathCtx = pathCanvas.getContext('2d');

const rows = 50;
const cols = 50;
const cellSize = mazeCanvas.width / cols;

// Maze Generator: Recursive Backtracking
function generateMaze(rows, cols){
    const maze = Array(rows).fill(null).map(()=>Array(cols).fill(1));
    const stack = [];
    const visited = Array(rows).fill(null).map(()=>Array(cols).fill(false));

    const start = {x:0, y:0};
    maze[start.y][start.x] = 0;
    visited[start.y][start.x] = true;
    stack.push(start);

    const directions = [{x:0,y:-2},{x:0,y:2},{x:-2,y:0},{x:2,y:0}];

    while(stack.length){
        const current = stack[stack.length-1];
        const neighbors = directions
            .map(d => ({x: current.x+d.x, y: current.y+d.y}))
            .filter(n => n.x>=0 && n.x<cols && n.y>=0 && n.y<rows && !visited[n.y][n.x]);

        if(neighbors.length){
            const next = neighbors[Math.floor(Math.random()*neighbors.length)];
            maze[(current.y+next.y)/2][(current.x+next.x)/2] = 0;
            maze[next.y][next.x] = 0;
            visited[next.y][next.x] = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }
    return maze;
}

const maze = generateMaze(rows, cols);

// Fix: Make sure end point is on empty cell
const end = {x: cols-1, y: Math.floor(rows/2)};
if (maze[end.y][end.x] === 1) {
    // find nearest empty cell
    outer: for (let y=rows-1;y>=0;y--){
        for (let x=cols-1;x>=0;x--){
            if (maze[y][x]===0){ end.x=x; end.y=y; break outer; }
        }
    }
}

// Bot setup
const startRed = {x:0, y:0};
const startBlue = {x:0, y:rows-1};

class Bot {
    constructor(color, start){
        this.color=color;
        this.pos={...start};
        this.path=[];
        this.visited = Array(rows).fill(null).map(()=>Array(cols).fill(false));
        this.queue = [];
        this.finished=false;
        this.steps=0;
        this.computePath();
    }

    computePath(){
        this.queue = [{x:this.pos.x, y:this.pos.y, path:[]}];
        const visited = Array(rows).fill(null).map(()=>Array(cols).fill(false));
        visited[this.pos.y][this.pos.x]=true;

        while(this.queue.length){
            const current = this.queue.shift();
            this.visited[current.y][current.x] = true; // Fix: update visited for debugger

            if(current.x===end.x && current.y===end.y){
                this.path=current.path;
                break;
            }

            const directions=[{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
            directions.sort(()=>Math.random()-0.5);

            for(const dir of directions){
                const nx=current.x+dir.x;
                const ny=current.y+dir.y;
                if(nx>=0 && nx<cols && ny>=0 && ny<rows && maze[ny][nx]===0 && !visited[ny][nx]){
                    visited[ny][nx]=true;
                    this.queue.push({x:nx,y:ny,path:[...current.path,{x:nx,y:ny}]});
                }
            }
        }
    }

    move(){
        if(this.path.length>0){
            this.pos=this.path.shift();
            this.steps++;
        } else {
            this.finished=true;
        }
    }
}

const botRed = new Bot('red', startRed);
const botBlue = new Bot('blue', startBlue);

// ===== Draw functions (unchanged except drawPaths) =====
function drawMaze(){
    for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
            ctx.fillStyle=maze[y][x]===1?'black':'white';
            ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);
        }
    }
    ctx.fillStyle='green';
    ctx.beginPath();
    ctx.arc(end.x*cellSize+cellSize/2,end.y*cellSize+cellSize/2,cellSize/2,0,2*Math.PI);
    ctx.fill();

    ctx.fillStyle=botRed.color;
    ctx.fillRect(botRed.pos.x*cellSize, botRed.pos.y*cellSize, cellSize, cellSize);

    ctx.fillStyle=botBlue.color;
    ctx.fillRect(botBlue.pos.x*cellSize, botBlue.pos.y*cellSize, cellSize, cellSize);
}

function drawDebugger(bot, ctxDebug){
    const debugCell = redCanvas.width/cols;
    for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
            if(bot.visited[y][x]){
                ctxDebug.fillStyle='yellow';
            } else if(maze[y][x]===1){
                ctxDebug.fillStyle='black';
            } else {
                ctxDebug.fillStyle='white';
            }
            ctxDebug.fillRect(x*debugCell,y*debugCell,debugCell,debugCell);
        }
    }
}

function drawMap(){
    const mapCell = mapCanvas.width/cols;
    for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
            mapCtx.fillStyle=maze[y][x]===1?'black':'white';
            mapCtx.fillRect(x*mapCell, y*mapCell, mapCell, mapCell);
        }
    }
    mapCtx.fillStyle='red';
    mapCtx.fillRect(botRed.pos.x*mapCell, botRed.pos.y*mapCell, mapCell, mapCell);
    mapCtx.fillStyle='blue';
    mapCtx.fillRect(botBlue.pos.x*mapCell, botBlue.pos.y*mapCell, mapCell, mapCell);
    mapCtx.fillStyle='green';
    mapCtx.beginPath();
    mapCtx.arc(end.x*mapCell+mapCell/2,end.y*mapCell+mapCell/2,mapCell/2,0,2*Math.PI);
    mapCtx.fill();
}

function drawPaths(){
    const pathCell = pathCanvas.width/cols;
    [botRed, botBlue].forEach(bot=>{
        bot.path.forEach(p=>{
            pathCtx.fillStyle=bot.color;
            pathCtx.fillRect(p.x*pathCell,p.y*pathCell,pathCell,pathCell);
        });
    });
}

// ===== Game loop =====
let startTime = null;
function gameLoop(timestamp){
    if(!startTime) startTime=timestamp;
    const elapsed=((timestamp-startTime)/1000).toFixed(2);

    botRed.move();
    botBlue.move();

    drawMaze();
    drawDebugger(botRed, redCtx);
    drawDebugger(botBlue, blueCtx);
    drawMap();

    pathCtx.clearRect(0,0,pathCanvas.width,pathCanvas.height);
    drawPaths();

    document.getElementById('timeTaken').innerText=`Time elapsed: ${elapsed}s`;

    if(botRed.pos.x===end.x && botRed.pos.y===end.y){
        document.getElementById('winner').innerText=`Red Bot Wins! Steps: ${botRed.steps}, Time: ${elapsed}s`;
        return;
    }
    if(botBlue.pos.x===end.x && botBlue.pos.y===end.y){
        document.getElementById('winner').innerText=`Blue Bot Wins! Steps: ${botBlue.steps}, Time: ${elapsed}s`;
        return;
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
