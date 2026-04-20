class Game{
    constructor(mode){
        this.levelSelectMenu = document.querySelector('#level-select');
        this.pauseBtn = document.querySelector('#pause-btn');
        this.pauseBanner = document.querySelector('#pause-banner');
        this.menu = document.querySelector('#menu');
        this.pauseMenu = document.querySelector('#pause-menu');
        this.winMenu = document.querySelector('#win-menu');
        this.editorUI = document.querySelector('#editor-ui');
        this.timerWindow = document.querySelector('#timer');
        this.timerEl = this.timerWindow.querySelector('.time');
        this.timerEl.innerHTML = `<i class='bx bxs-time'></i>&nbsp;${Util.formatSeconds(0)}`;
        this.winBanner = document.querySelector('#win-banner');

        this.currentMode = mode;
        this.transitions = [];
        this.lastTime = performance.now();
        this.textureManager = new TextureManager(new THREE.TextureLoader());

        this.level = undefined;
        this.levelTimer = 0;
        this.levelTimerInterval = undefined;

        this.init();
    }

    init(){
        this.addLevels();
        this.initScene();
        this.initListeners();
    }

    addLevels(){
        const levelWrapper = this.levelSelectMenu.querySelector('.level-wrapper');
        let currentCategory;
        for(const level of LEVELS){
            const path = `levels/${level}.lvl`;
            // create category if category changed
            if(currentCategory !== LEVEL_DATA[path].category){
                currentCategory = LEVEL_DATA[path].category;
                const category = document.createElement('div');
                category.className = 'level-category';
                category.innerHTML = currentCategory;
                levelWrapper.appendChild(category);
            }

            const levelItem = document.createElement('div');
            levelItem.className = 'level';
            levelItem.setAttribute('data-path',path);
            levelItem.setAttribute('data-name',LEVEL_DATA[path].name);
            levelItem.innerHTML = `
                <img loading="lazy" src="img/question.png">
                <div class="size">${LEVEL_DATA[path].size}</div>
                <div class="name bottom">???</div>
                <div class="stats hidden">
                    <div class="time"></div>
                    <div class="stars"></div>
                </div>
            `;

            levelWrapper.appendChild(levelItem);
        }
    }

    initScene(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.gridOffset = 0.5;

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor( 0xf0dbb1, 0);
        document.body.appendChild(this.renderer.domElement);

        // lighting
        const ambientLight = new THREE.AmbientLight('white', 0.75);
        this.scene.add(ambientLight);

        const light = new THREE.DirectionalLight('white', 0.3);
        light.position.set( 1, 1, 1 );
        this.scene.add(light);

        const light2 = new THREE.DirectionalLight('#ccc', 0.3);
        light2.position.set( 0, 15, 0 );
        this.scene.add(light2);

        // init orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        // disable everything besides rotating with mouse left button
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: '',
            RIGHT: ''
        };

        // set camera position
        this.camera.position.x = -5;
        this.camera.position.y = 10;
        this.camera.position.z = 10;

        const size = 9;
        const divisions = 9;

        // init grid
        this.gridHelper = new THREE.GridHelper(size, divisions, new THREE.Color(0xFFFFFF), new THREE.Color(0xAAAAAA));
        // disable raycast on grid
        this.gridHelper.disableRaycast = true;
        // set target for orbit control
        this.controls.target = this.gridHelper.position;
        this.scene.add(this.gridHelper);
        this.gridHelper.scale.x = 0;
        this.gridHelper.scale.y = 0;
        this.gridHelper.scale.z = 0;
    }

    // initialize event listeners
    initListeners(){
        // add resize listener
        window.addEventListener('resize', this.resize.bind(this), false);
        
        // add mouse down event listener
        document.addEventListener('mousedown', this.mouseDown.bind(this));
    }

    // start rendering
    run(){
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    // render loop
    animate(now) {
        requestAnimationFrame(this.animate.bind(this));
        // calculate delta time in seconds for frame-rate independent transitions
        const dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap at 100ms
        this.lastTime = now;
        this.controls.update();
        this.handleTransitions(dt);
        this.renderer.render(this.scene, this.camera);
    }

    // resize handler
    resize(){
        // update camera and renderer
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // mouse down handler
    mouseDown(e){
        e.preventDefault();
        // nothing on left click (unless in editor)
        if(this.pauseMenu.classList.contains('show')) return;
        if(e.button === 0 && this.currentMode !== MODES.EDITING) return;

        // calc 3d mouse vector
        const mouse3D = Util.pointToVector(e.clientX, e.clientY);    

        // create raycaster from mouse and camera
        const raycaster =  new THREE.Raycaster();                                        
        raycaster.setFromCamera(mouse3D, this.camera);
        // check if raycaster intersects with any objects (apart from objects that have raycast disabled)
        const intersects = raycaster.intersectObjects(this.scene.children.filter(c => !c.disableRaycast));

        // editor mode handling
        if(this.currentMode === MODES.EDITING){
            if(e.button === 2 || e.button === 0){
                if(intersects.length > 0){
                    const hit = intersects[0];
                    const obj = hit.object;

                    if(obj.name === 'editor-ground'){
                        // clicked on ground plane — place block at grid position (y=0)
                        if(this.editorTool === 'place'){
                            const point = hit.point;
                            const x = Math.floor(point.x);
                            const y = 0;
                            const z = Math.floor(point.z);
                            if(x >= 0 && x < 9 && z >= 0 && z < 9){
                                this.editorPlaceBlock(x, y, z);
                            }
                        }
                    } else if(obj.name === 'block'){
                        const x = Math.floor(obj.position.x);
                        const y = Math.floor(obj.position.y);
                        const z = Math.floor(obj.position.z);

                        if(this.editorTool === 'remove'){
                            this.editorRemoveBlock(x, y, z);
                        } else if(this.editorTool === 'color'){
                            this.editorColorBlock(x, y, z);
                        } else if(this.editorTool === 'place'){
                            // place on the face that was clicked (adjacent block)
                            const face = hit.face.normal;
                            const nx = x + Math.round(face.x);
                            const ny = y + Math.round(face.y);
                            const nz = z + Math.round(face.z);
                            if(nx >= 0 && nx < 9 && ny >= 0 && ny < 9 && nz >= 0 && nz < 9){
                                this.editorPlaceBlock(nx, ny, nz);
                            }
                        }
                    }
                }
            }
            return;
        }

        if(intersects.length > 0){
            if(e.button === 2 && e.altKey){
                // layer, z, x
                const obj = intersects[0].object;
                // get position of clicked block
                const x = Math.floor(obj.position.x);
                const y = Math.floor(obj.position.y);
                const z = Math.floor(obj.position.z);
                const blockState = this.level.blockMap[x][y][z];
                // if block is marked it cant be destroyed
                if(obj.marked === true){
                    this.transitions.push(new Transition(obj, 'scale', 1.1, 1.0, 'in'));
                    return;
                }
                // if block is non destroyable, mark it and reduce players life
                if(blockState === BLOCK_STATE.NON_DESTROYABLE){
                    obj.marked = true;
                    this.transitions.push(new Transition(obj, 'scale', 1.1, 1.0, 'in'));
                    for(const mat of obj.material){
                        mat.color.setHex(0x1c55a0);
                    }
                    this.checkForRowsColumns(x,y,z);
                    // TODO: reduce players life
                    return;
                }
                this.transitions.push(new Transition(obj, 'scale', 0.0, 1.0, 'out', 3.0, ()=>{
                    obj.geometry.dispose();
                    this.disposeMaterials(obj);
                    this.scene.remove(obj);
                }));
                obj.disableRaycast = true;
                // remove block from blocks array
                this.level.blocks[x][y][z] = undefined;
                this.checkForRowsColumns(x,y,z);
            // right click without alt key
            } else if(e.button === 2){
                // layer, z, x
                const obj = intersects[0].object;
                // get position of clicked block
                const x = Math.floor(obj.position.x);
                const y = Math.floor(obj.position.y);
                const z = Math.floor(obj.position.z);

                // add transition to clicked block
                this.transitions.push(new Transition(obj, 'scale', 1.1, 1.0, 'in'));
                // get materials
                const materials = obj.material;
                if(obj.marked === true && obj.fixed === true) return;
                obj.marked = !obj.marked;
                for(const mat of materials){
                    // if cube is already marked reset
                    if(!obj.marked) mat.color.setHex(0xFFFFFF);
                    // else mark it
                    else mat.color.setHex(0x1c55a0);
                }
                this.checkForRowsColumns(x,y,z);
            }
        }
    }

    // handle transitions (dt = delta time in seconds)
    handleTransitions(dt){
        const transitionsToRemove = [];
        for(const transition of this.transitions){
            const step = transition.speed * dt;
            const done = (t) => {
                transitionsToRemove.push(t);
                if(t.onComplete) t.onComplete();
            };
            switch(transition.prop){
                case 'scale':
                    if(transition.to > transition.from){
                        if(transition.target.scale.x < transition.to){
                            transition.target.scale.x = Math.min(transition.target.scale.x + step, transition.to);
                            transition.target.scale.y = transition.target.scale.x;
                            transition.target.scale.z = transition.target.scale.x;
                        } else if(transition.type === 'in') {
                            transition.target.scale.x = transition.to;
                            transition.target.scale.y = transition.to;
                            transition.target.scale.z = transition.to;
                            transitionsToRemove.push(transition);
                            this.transitions.push(new Transition(transition.target, 'scale', transition.from, transition.to, 'out', transition.speed, transition.onComplete));
                        } else {
                            transition.target.scale.x = transition.to;
                            transition.target.scale.y = transition.to;
                            transition.target.scale.z = transition.to;
                            done(transition);
                        }
                    } else {
                        if(transition.target.scale.x > transition.to){
                            transition.target.scale.x = Math.max(transition.target.scale.x - step, transition.to);
                            transition.target.scale.y = transition.target.scale.x;
                            transition.target.scale.z = transition.target.scale.x;
                        } else if(transition.type === 'in') {
                            transition.target.scale.x = transition.to;
                            transition.target.scale.y = transition.to;
                            transition.target.scale.z = transition.to;
                            transitionsToRemove.push(transition);
                            this.transitions.push(new Transition(transition.target, 'scale', transition.from, transition.to, 'out', transition.speed, transition.onComplete));
                        } else {
                            transition.target.scale.x = transition.to;
                            transition.target.scale.y = transition.to;
                            transition.target.scale.z = transition.to;
                            done(transition);
                        }
                    }
                    break;
                case 'opacity':
                    if(transition.to > transition.from){
                        if(transition.target.material.opacity < transition.to){
                            transition.target.material.opacity = Math.min(transition.target.material.opacity + step, transition.to);
                        } else if(transition.type === 'in') {
                            transition.target.material.opacity = transition.to;
                            transitionsToRemove.push(transition);
                            this.transitions.push(new Transition(transition.target, 'opacity', transition.from, transition.to, 'out', transition.speed, transition.onComplete));
                        } else {
                            transition.target.material.opacity = transition.to;
                            done(transition);
                        }
                    } else {
                        if(transition.target.material.opacity > transition.to){
                            transition.target.material.opacity = Math.max(transition.target.material.opacity - step, transition.to);
                        } else if(transition.type === 'in') {
                            transition.target.material.opacity = transition.to;
                            transitionsToRemove.push(transition);
                            this.transitions.push(new Transition(transition.target, 'opacity', transition.from, transition.to, 'out', transition.speed, transition.onComplete));
                        } else {
                            transition.target.material.opacity = transition.to;
                            done(transition);
                        }
                    }
                    break;
            }
        }

        // remove finished transitions
        for(const transition of transitionsToRemove) this.transitions.splice(this.transitions.indexOf(transition),1);
    }

    // place a block at a specific position
    placeBlock(x,y,z,index,transition){
        // get hints for that position
        const hints = this.level.hintMap[x][y][z];
        
        // right, left, top, bottom, front, back
        const urls = [
            `img/block${hints.horizontalRightLeft}_${hints.horizontalRightLeftType}.png`, `img/block${hints.horizontalRightLeft}_${hints.horizontalRightLeftType}.png`,
            `img/block${hints.vertical}_${hints.verticalType}.png`, `img/block${hints.vertical}_${hints.verticalType}.png`,
            `img/block${hints.horizontalBackFront}_${hints.horizontalBackFrontType}.png`,`img/block${hints.horizontalBackFront}_${hints.horizontalBackFrontType}.png`
        ];
                    
        // load textures
        const materials = urls.map(url => {
            const tex = this.textureManager.load(url);
            tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
            const mat = new THREE.MeshPhongMaterial({ map: tex });
            mat.specular = new THREE.Color(0x000000);
            mat.map.minFilter = mat.map.maxFilter = THREE.LinearFilter;
            return mat;
        });

        // create box and set position
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const block = new THREE.Mesh(geometry, materials);

        block.name = 'block';
        block.state = this.level.blockMap[x][y][z];
        block.marked = false;
        block.position.x = x + this.gridOffset;
        block.position.y = y + this.gridOffset;
        block.position.z = z + this.gridOffset;

        // check if block should be transitioned (scaled up)
        if(transition){
            block.scale.x = 0;
            block.scale.y = 0;
            block.scale.z = 0;
        }
        this.level.blocks[x][y][z] = block;
        this.scene.add(block);

        // add upscale transition if block should be scaled up
        if(transition){
            setTimeout(()=>{
                this.transitions.push(new Transition(block, 'scale', 1.0, 0.0, 'out', 3.0));
            }, 200 + (10 * index));
        }
    }

    // checks if any of the rows and columns of the block at the given position is finished
    // and grays them out to show that this column is finished
    checkForRowsColumns(x,y,z){
        // vertical check (top bottom)
        // if there is a block that can be destroyed the column is not finished
        // neither if one of the non destroyable blocks is not marked
        let destroyableBlocks = 0; let nonMarkedBlocks = 0;
        for(let y1 = 0; y1 < this.level.size.y; y1++){
            const block = this.level.blocks[x][y1][z];
            if(!block) continue;
            if(block.state === BLOCK_STATE.DESTROYABLE) destroyableBlocks++;
            if(block.state === BLOCK_STATE.NON_DESTROYABLE && block.marked === false) nonMarkedBlocks++;
        }

        // if there arent any destroyable blocks or non marked blocks left gray them out to show they are fixed now
        if(destroyableBlocks === 0 && nonMarkedBlocks === 0){
            for(let y1 = 0; y1 < this.level.size.y; y1++){
                const block = this.level.blocks[x][y1][z];
                if(!block) continue;
                block.material[BLOCK_SIDE.TOP].opacity = 0.7;
                block.material[BLOCK_SIDE.BOTTOM].opacity = 0.7;
                block.fixed = true;
            }
        }

        // reset variables
        destroyableBlocks = 0; nonMarkedBlocks = 0;

        // horizontal check (left right)
        for(let x1 = 0; x1 < this.level.size.x; x1++){
            const block = this.level.blocks[x1][y][z];
            if(!block) continue;
            if(block.state === BLOCK_STATE.DESTROYABLE) destroyableBlocks++;
            if(block.state === BLOCK_STATE.NON_DESTROYABLE && block.marked === false) nonMarkedBlocks++;
        }

        // if there arent any destroyable blocks or non marked blocks left gray them out to show they are fixed now
        if(destroyableBlocks === 0 && nonMarkedBlocks === 0){
            for(let x1 = 0; x1 < this.level.size.x; x1++){
                const block = this.level.blocks[x1][y][z];
                if(!block) continue;
                block.material[BLOCK_SIDE.LEFT].opacity = 0.7;
                block.material[BLOCK_SIDE.RIGHT].opacity = 0.7;
                block.fixed = true;
            }
        }

        // reset variables
        destroyableBlocks = 0; nonMarkedBlocks = 0;

        // horizontal check (front back)
        for(let z1 = 0; z1 < this.level.size.z; z1++){
            const block = this.level.blocks[x][y][z1];
            if(!block) continue;
            if(block.state === BLOCK_STATE.DESTROYABLE) destroyableBlocks++;
            if(block.state === BLOCK_STATE.NON_DESTROYABLE && block.marked === false) nonMarkedBlocks++;
        }

        // if there arent any destroyable blocks or non marked blocks left gray them out to show they are fixed now
        if(destroyableBlocks === 0 && nonMarkedBlocks === 0){
            for(let z1 = 0; z1 < this.level.size.z; z1++){
                const block = this.level.blocks[x][y][z1];
                if(!block) continue;
                block.material[BLOCK_SIDE.FRONT].opacity = 0.7;
                block.material[BLOCK_SIDE.BACK].opacity = 0.7;
                block.fixed = true;
            }
        }

        // check if game is over
        const winState = this.checkForWin();
        if(winState){
            // show all layers
            this.updateLayers('x', 0);
            this.updateLayers('y', 0);
            this.updateLayers('z', 0);

            // remove handles (transition them out)
            for(const handle of this.level.layerHandles){
                handle.setPosition(handle.originPos.x, handle.originPos.y, handle.originPos.z);
                this.transitions.push(new Transition(handle.handle, 'opacity', 0.0, 1.0, 'out', 3.0));
            }

            // set colors after a little delay and switch to won mode after
            setTimeout(()=>{
                this.setColors();
                setTimeout(()=>{
                    this.switchMode(MODES.WON);
                },400);
            },200);
        }
    }

    setColors(){
        let index = 0;
        // place blocks after level loaded
        for(let x = 0; x < this.level.size.x; x++){
            for(let y = 0; y < this.level.size.y; y++){
                for(let z = 0; z < this.level.size.z; z++){
                    if(this.level.colorMap[x][y][z] === 0) continue;
                    // replace old material with color (after some delay)
                    setTimeout(()=>{
                        this.level.blocks[x][y][z].material = new THREE.MeshPhongMaterial( { color: new THREE.Color(this.level.colorMap[x][y][z]) } );
                    },150 + (20 * index));
                }
                index++;
            }
        }
    }

    checkForWin(){
        // place blocks after level loaded
        for(let x = 0; x < this.level.size.x; x++){
            for(let y = 0; y < this.level.size.y; y++){
                for(let z = 0; z < this.level.size.z; z++){
                    // for blocks its normal x,y,z
                    if(!this.level.blocks[x][y][z]) continue;
                    // x, layer (y), z
                    const state = this.level.blockMap[x][y][z];
                    const fixed = this.level.blocks[x][y][z].fixed;
                    // if there is one block left thats destroyable or one that is not fixed game is not won yet
                    if(state === BLOCK_STATE.DESTROYABLE || fixed !== true) return false;
                }
            }
        }

        return true;
    }

    // switch mode (MENU, PLAY, EDIT)
    async switchMode(mode, lvl){
        const prevMode = this.currentMode;
        if(this.currentMode == mode) return;
        this.currentMode = mode;

        switch(this.currentMode){
            case MODES.MENU:
                if(this.levelTimerInterval){
                    this.levelTimer = 0;
                    this.timerEl.innerHTML = `<i class='bx bxs-time'></i>&nbsp;${Util.formatSeconds(0)}`;
                    clearInterval(this.levelTimerInterval);
                }

                this.controls.autoRotate = false;
                this.controls.enabled = false;
                this.winBanner.classList.remove('show');
                // update dom elements
                setTimeout(()=>{
                    this.menu.classList.add('show');
                    this.pauseBtn.classList.remove('show');
                    this.pauseMenu.classList.remove('show');
                    this.pauseBanner.classList.remove('show');
                    this.levelSelectMenu.classList.remove('show');
                    this.winMenu.classList.remove('show');
                    this.timerWindow.classList.remove('show');
                    this.editorUI.classList.remove('show');
                }, prevMode === MODES.LEVEL_SELECT ? 0 : 300);

                // transition grid out
                this.transitions.push(new Transition(this.gridHelper, 'scale', 0.0, 1.0, 'out', 3.0));

                // clean up editor if coming from editor
                if(prevMode === MODES.EDITING){
                    if(this.editorBlocks){
                        for(const [key, entry] of this.editorBlocks){
                            this.transitions.push(new Transition(entry.mesh, 'scale', 0.0, 1.0, 'out', 3.0, ()=>{
                                entry.mesh.geometry.dispose();
                                this.disposeMaterials(entry.mesh);
                                this.scene.remove(entry.mesh);
                            }));
                            entry.mesh.disableRaycast = true;
                        }
                        this.editorBlocks.clear();
                    }
                    if(this.editorGround){
                        this.scene.remove(this.editorGround);
                        this.editorGround.geometry.dispose();
                        this.editorGround.material.dispose();
                        this.editorGround = undefined;
                    }
                }

                if(this.level){
                    // reset level and layer handles
                    for(const handle of this.level.layerHandles){
                        this.transitions.push(new Transition(handle.handle, 'opacity', 0.0, 1.0, 'out', 3.0, ()=>{
                            handle.handle.geometry.dispose();
                            handle.handle.material.dispose();
                            this.scene.remove(handle.handle);
                        }));
                    }

                    // disable and dispose drag controls
                    if(this.dragControls){
                        this.dragControls.deactivate();
                        this.dragControls.dispose();
                        this.dragControls = undefined;
                    }

                    this.level.layerHandles = [];
                    this.level = undefined;
                }

                // remove all blocks
                this.cleanupBlocks();
                break;
            case MODES.PLAYING:
                if(this.levelTimerInterval){
                    this.levelTimer = 0;
                    this.timerEl.innerHTML = `<i class='bx bxs-time'></i>&nbsp;${Util.formatSeconds(0)}`;
                    clearInterval(this.levelTimerInterval);
                }

                this.controls.enabled = true;
                // update dom elements
                this.menu.classList.remove('show');
                this.pauseBtn.classList.add('show');
                this.levelSelectMenu.classList.remove('show');
                this.timerWindow.classList.add('show');
                this.editorUI.classList.remove('show');
                
                // load level
                this.level = await Level.loadFromFile(lvl);
                this.transitions.push(new Transition(this.gridHelper, 'scale', 1.0, 0.0, 'out', 3.0));

                // create box and set position
                this.level.layerHandles.push(new LayerHandle(this.scene, 0x00FF00, {x: this.level.size.x, y: this.level.size.y + 1, z: this.level.size.z}, undefined, ['x','z']));
                this.level.layerHandles.push(new LayerHandle(this.scene, 0xFF0000, {x: this.level.size.x, y: 0, z: this.level.size.z + 1}, {x: 90, y: 0, z: 0}, ['x','y']));
                this.level.layerHandles.push(new LayerHandle(this.scene, 0x0000FF, {x: -1, y: 0, z: 0}, {x: 0, y: 0, z: 90}, ['y','z']));

                // add drag controls to layer handles
                this.dragControls = new THREE.DragControls(this.level.layerHandles.map(l => l.handle), this.camera, this.renderer.domElement);

                // drag start handler
                this.dragControls.addEventListener('dragstart', (e) => {
                    // set emissive color
                    e.object.material.emissive.set(0xaaaaaa);
                    // disable orbit controls
                    this.controls.enabled = false;
                    // set fixed positions for handle
                    for(const handle of this.level.layerHandles){
                        for(const key of Object.keys(handle.fixedPos)){
                            handle.handle.position[key] = handle.fixedPos[key];
                        }
                    }
                });

                // drag handler
                this.dragControls.addEventListener('drag', (e) => {
                    for(const handle of this.level.layerHandles){
                        if(e.object.color === handle.color){
                            ['x','y','z'].filter(a => !handle.fixedAxes.includes(a)).forEach((k)=>{
                                handle.handle.position[k] = Math.round(handle.handle.position[k]);
                                // make sure handle doesnt go out of bounds
                                if(handle.originPos[k] > 0){
                                    // handle cant go past the original position (y and z axis)
                                    if(handle.handle.position[k] > handle.originPos[k]) handle.handle.position[k] = handle.originPos[k];
                                    // calc diff between origin and current position
                                    let diff = handle.originPos[k] - handle.handle.position[k];
                                    // max position is the level size (in the given axis) - 1
                                    // if diff is greater move handle back
                                    if(diff > this.level.size[k] - 1){
                                        handle.handle.position[k] -= (this.level.size[k] - 1) - diff;
                                        diff = this.level.size[k] - 1;
                                    }
                                    // update layers
                                    this.updateLayers(k, Math.abs(diff));
                                } else {
                                    // handle cant go past the original position (x axis)
                                    if(handle.handle.position[k] < handle.originPos[k]) handle.handle.position[k] = handle.originPos[k];
                                    // calc diff between origin and current position
                                    let diff = handle.originPos[k] - handle.handle.position[k];
                                    // max position is the level size (in the given axis) - 1
                                    // if diff is smaller move handle back
                                    if(diff < -(this.level.size[k] - 1)){
                                        handle.handle.position[k] += (this.level.size[k] - 1) + diff;
                                        diff = -handle.handle.position[k] - 1;
                                    }
                                    // update layers
                                    this.updateLayers(k, Math.abs(diff));
                                }
                            });
                        }

                        // set fixed positions for handle
                        for(const key of Object.keys(handle.fixedPos)){
                            handle.handle.position[key] = handle.fixedPos[key];
                        }
                    }
                });

                // drag end lisstener
                this.dragControls.addEventListener('dragend', (e) => {
                    // remove emissive color
                    e.object.material.emissive.set(0x000000);
                    // enable rotate controls again
                    this.controls.enabled = true;
                    // set fixed positions for handle
                    for(const handle of this.level.layerHandles){
                        for(const key of Object.keys(handle.fixedPos)){
                            handle.handle.position[key] = handle.fixedPos[key];
                        }
                    }
                });

                // fade in handles
                setTimeout(()=>{
                    this.transitions.push(new Transition(this.level.layerHandles[0].handle, 'opacity', 1.0, 0.0, 'out', 3.0));
                    this.transitions.push(new Transition(this.level.layerHandles[1].handle, 'opacity', 1.0, 0.0, 'out', 3.0));
                    this.transitions.push(new Transition(this.level.layerHandles[2].handle, 'opacity', 1.0, 0.0, 'out', 3.0));
                },500);

                let index = 0;
                // place blocks after level loaded
                for(let x = 0; x < this.level.size.x; x++){
                    for(let y = 0; y < this.level.size.y; y++){
                        for(let z = 0; z < this.level.size.z; z++){
                            // layer, z, x
                            this.placeBlock(x,y,z,index,true);
                            index++;
                        }
                    }
                }

                // set grid position and set orbit controls target
                this.gridHelper.position.x = Math.floor(this.level.size.x / 2);
                this.gridHelper.position.z = Math.floor(this.level.size.z / 2);
                this.controls.target = this.gridHelper.position;

                setTimeout(()=>{
                    this.levelTimerInterval = setInterval(()=>{
                        this.levelTimer += 1;
                        this.timerEl.innerHTML = `<i class='bx bxs-time'></i>&nbsp;${Util.formatSeconds(this.levelTimer)}`;
                    },1000);
                },500);
                break;
            case MODES.LEVEL_SELECT:
                if(this.levelTimerInterval){
                    this.levelTimer = 0;
                    this.timerEl.innerHTML = `<i class='bx bxs-time'></i>&nbsp;${Util.formatSeconds(0)}`;
                    clearInterval(this.levelTimerInterval);
                }

                this.controls.autoRotate = false;
                this.controls.enabled = false;
                this.winBanner.classList.remove('show');
                this.levelSelectMenu.classList.add('show');
                this.menu.classList.remove('show');
                this.pauseBtn.classList.remove('show');
                this.pauseMenu.classList.remove('show');
                this.pauseBanner.classList.remove('show');
                this.winMenu.classList.remove('show');
                this.timerWindow.classList.remove('show');
                this.editorUI.classList.remove('show');

                // if previous mode was won than level has to be cleaned up
                if(prevMode === MODES.WON){
                    // transition grid out
                    this.transitions.push(new Transition(this.gridHelper, 'scale', 0.0, 1.0, 'out', 3.0));

                    // reset level and layer handles
                    for(const handle of this.level.layerHandles){
                        this.transitions.push(new Transition(handle.handle, 'opacity', 0.0, 1.0, 'out', 3.0, ()=>{
                            handle.handle.geometry.dispose();
                            handle.handle.material.dispose();
                            this.scene.remove(handle.handle);
                        }));
                    }

                    // disable and dispose drag controls 
                    this.dragControls.deactivate();
                    this.dragControls.dispose();
                    this.dragControls = undefined;

                    this.level.layerHandles = [];
                    this.level = undefined;

                    // remove all blocks
                    for(const obj of this.scene.children.filter(c => c.name === 'block')){
                        this.transitions.push(new Transition(obj, 'scale', 0.0, 1.0, 'out', 3.0, ()=>{
                            obj.geometry.dispose();
                            this.disposeMaterials(obj);
                            this.scene.remove(obj);
                        }));
                        obj.disableRaycast = true;
                    }
                }

                const level_progress = JSON.parse(localStorage.getItem('level_progress')) || [];
                const levels = Array.from(document.querySelectorAll('#level-select .level'));
                for(const level of levels){
                    const path = level.getAttribute('data-path');
                    level.onclick = () => {
                        game.switchMode(MODES.PLAYING, path);
                    };
                    const stats = level_progress.find(l => l.path === path);
                    if(stats){
                        level.querySelector('img').src = `img/${path.replace('.lvl','.png')}`;
                        level.querySelector('.name').innerHTML = level.getAttribute('data-name');
                        level.querySelector('.name').classList.remove('bottom');
                        level.querySelector('.stats').classList.remove('hidden');
                        let stars = ``;
                        for(let s = 0; s < stats.stars; s++) stars += `<i class='bx bxs-star star'></i>`;
                        for(let s = 0; s < 3 - stats.stars; s++) stars += `<i class='bx bxs-star star-empty'></i>`;
                        level.querySelector('.stars').innerHTML = stars;
                        level.querySelector('.time').innerHTML = `<i class='bx bx-timer'></i>&nbsp;${Util.formatSeconds(stats.time)}`;
                    }
                }
                break;
            case MODES.WON:
                if(this.levelTimerInterval){
                    clearInterval(this.levelTimerInterval);
                }

                // start auto-rotating around the completed model
                this.controls.autoRotate = true;
                this.controls.autoRotateSpeed = 4.0;
                this.controls.enabled = true;

                // show level name
                const levelName = LEVEL_DATA[this.level.path] ? LEVEL_DATA[this.level.path].name : 'Level Complete';
                this.winBanner.textContent = levelName;
                this.winBanner.classList.add('show');

                // get the level progress from local storage
                const wonLevels = localStorage.getItem('level_progress');
                const time = this.levelTimer;
                this.levelTimer = 0;
                if(wonLevels){
                    let level_progress = JSON.parse(wonLevels);
                    const stats = level_progress.find(l => l.path === this.level.path);
                    // check how many stars the user has scored based on the time
                    let stars = 1;
                    for(const key in LEVEL_DATA[this.level.path].times){
                        if(time <= parseInt(key)){
                            stars = LEVEL_DATA[this.level.path].times[key];
                            break;
                        }
                    }
                    // if there are no stats for the level yet or user scored a better time replace / add score to list
                    if(!stats || stats.time > time){
                        level_progress = level_progress.filter(l => l.path !== this.level.path);
                        level_progress.push({path: this.level.path, stars: stars, time: time});
                        localStorage.setItem('level_progress',JSON.stringify(level_progress));
                    }
                // if this is the first level create object
                } else {
                    let stars = 1;
                    // check how many stars the user has scored based on the time
                    for(const key in LEVEL_DATA[this.level.path].times){
                        if(time <= parseInt(key)){
                            stars = LEVEL_DATA[this.level.path].times[key];
                            break;
                        }
                    }
                    localStorage.setItem('level_progress',JSON.stringify([{path: this.level.path, stars: stars, time: time}]));
                }
                // update dom elements
                setTimeout(()=>{
                    this.menu.classList.remove('show');
                    this.pauseBtn.classList.remove('show');
                    this.pauseMenu.classList.remove('show');
                    this.pauseBanner.classList.remove('show');
                    this.levelSelectMenu.classList.remove('show');
                    this.winMenu.classList.add('show');
                    this.editorUI.classList.remove('show');
                }, 300);

                // hide timer
                this.timerWindow.classList.remove('show');
                this.pauseBtn.classList.remove('show');
                break;
            case MODES.EDITING:
                this.controls.enabled = true;
                // hide all other UI
                this.menu.classList.remove('show');
                this.pauseBtn.classList.remove('show');
                this.pauseMenu.classList.remove('show');
                this.pauseBanner.classList.remove('show');
                this.levelSelectMenu.classList.remove('show');
                this.winMenu.classList.remove('show');
                this.timerWindow.classList.remove('show');
                this.editorUI.classList.add('show');

                // editor state
                this.editorTool = 'place';
                this.editorBlocks = new Map(); // key: "x,y,z" -> { mesh, color }
                this.editorGridSize = 9; // current grid size (units)

                // show grid
                this.transitions.push(new Transition(this.gridHelper, 'scale', 1.0, 0.0, 'out', 3.0));
                this.gridHelper.position.x = this.editorGridSize / 2;
                this.gridHelper.position.z = this.editorGridSize / 2;
                this.controls.target = this.gridHelper.position;

                // add ground plane for raycasting (invisible)
                this.editorGround = new THREE.Mesh(
                    new THREE.PlaneGeometry(this.editorGridSize, this.editorGridSize),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                this.editorGround.rotation.x = -Math.PI / 2;
                this.editorGround.position.set(this.editorGridSize / 2, 0, this.editorGridSize / 2);
                this.editorGround.name = 'editor-ground';
                this.scene.add(this.editorGround);
                break;
        }
    }

    // update the visibility of layers at the given axis to the given extent (how many layers to hide)
    updateLayers(axis, extent){
        let block;
        // iterate over all blocks
        for(let x = 0; x < this.level.size.x; x++){
            for(let y = 0; y < this.level.size.y; y++){
                for(let z = 0; z < this.level.size.z; z++){
                    block = this.level.blocks[x][y][z];
                    // if there is no block (removed already for example) skip iteration
                    if(!block) continue;
                    // based on axis check if block should be shown or not (and based on that disable / enable raycast interaction)
                    switch(axis){
                        case 'x':
                            // example: extent = 3, size = 4,4,4 | only the blocks with x < 3 will be hidden
                            if(x < extent){
                                block.visible = false;
                                block.disableRaycast = true;
                            } else {
                                block.visible = true;
                                block.disableRaycast = false;
                            }
                            break;
                        case 'y':
                            if(((this.level.size.y - 1) - y) < extent){
                                block.visible = false;
                                block.disableRaycast = true;
                            } else {
                                block.visible = true;
                                block.disableRaycast = false;
                            }
                            break;
                        case 'z':
                            if(((this.level.size.z - 1) - z) < extent){
                                block.visible = false;
                                block.disableRaycast = true;
                            } else {
                                block.visible = true;
                                block.disableRaycast = false;
                            }
                            break;
                    }
                }
            }
        }
    }

    // open pause menu (dom element)
    openPauseMenu(){
        this.controls.enabled = false;
        this.pauseMenu.classList.add('show');
        this.pauseBanner.classList.add('show');

        if(this.levelTimerInterval){
            clearInterval(this.levelTimerInterval);
        }
    }

    closePauseMenu(){
        this.controls.enabled = true;
        this.pauseMenu.classList.remove('show');
        this.pauseBanner.classList.remove('show');

        this.levelTimerInterval = setInterval(()=>{
            this.levelTimer += 1;
            this.timerEl.innerHTML = `<i class='bx bxs-time'></i>&nbsp;${Util.formatSeconds(this.levelTimer)}`;
        },1000);
    }

    // safely dispose a block's materials (handles both array and single material)
    disposeMaterials(obj){
        if(Array.isArray(obj.material)){
            obj.material.forEach((mat) => mat.dispose());
        } else {
            obj.material.dispose();
        }
    }

    // transition out and remove all blocks from the scene
    cleanupBlocks(){
        for(const obj of this.scene.children.filter(c => c.name === 'block')){
            this.transitions.push(new Transition(obj, 'scale', 0.0, 1.0, 'out', 3.0, ()=>{
                obj.geometry.dispose();
                this.disposeMaterials(obj);
                this.scene.remove(obj);
            }));
            obj.disableRaycast = true;
        }
    }

    // --- Editor methods ---

    setEditorTool(tool){
        this.editorTool = tool;
        document.querySelectorAll('#editor-ui .editor-tool').forEach(el => el.classList.remove('active'));
        document.querySelector(`#editor-ui .editor-tool[data-tool="${tool}"]`).classList.add('active');
        document.querySelector('#editor-ui .editor-color-picker').style.display = tool === 'color' ? 'flex' : 'none';
    }

    editorPlaceBlock(x, y, z){
        const key = `${x},${y},${z}`;
        if(this.editorBlocks.has(key)) return;

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const color = '#ffffff';
        const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(color) });
        material.specular = new THREE.Color(0x000000);
        const block = new THREE.Mesh(geometry, material);

        block.name = 'block';
        block.position.x = x + this.gridOffset;
        block.position.y = y + this.gridOffset;
        block.position.z = z + this.gridOffset;

        block.scale.set(0, 0, 0);
        this.transitions.push(new Transition(block, 'scale', 1.0, 0.0, 'out', 3.0));

        this.editorBlocks.set(key, { mesh: block, color: color });
        this.scene.add(block);

        // expand grid if block is near the edge
        this.editorUpdateGrid();
    }

    // expand grid and ground plane when blocks reach the edge
    editorUpdateGrid(){
        if(this.editorBlocks.size === 0) return;

        // find max x and z among placed blocks
        let maxX = 0, maxZ = 0;
        for(const key of this.editorBlocks.keys()){
            const [x, , z] = key.split(',').map(Number);
            if(x + 1 > maxX) maxX = x + 1;
            if(z + 1 > maxZ) maxZ = z + 1;
        }

        // need at least 1 cell of margin beyond the furthest block, max 9
        const needed = Math.min(Math.max(maxX + 1, maxZ + 1, 9), 9);
        if(needed <= this.editorGridSize) return;

        // grow grid
        this.editorGridSize = needed;
        const half = this.editorGridSize / 2;

        // replace grid helper
        this.scene.remove(this.gridHelper);
        this.gridHelper.geometry.dispose();
        if(Array.isArray(this.gridHelper.material)){
            this.gridHelper.material.forEach(m => m.dispose());
        } else {
            this.gridHelper.material.dispose();
        }
        this.gridHelper = new THREE.GridHelper(this.editorGridSize, this.editorGridSize, new THREE.Color(0xFFFFFF), new THREE.Color(0xAAAAAA));
        this.gridHelper.disableRaycast = true;
        this.gridHelper.position.x = half;
        this.gridHelper.position.z = half;
        this.scene.add(this.gridHelper);
        this.controls.target = this.gridHelper.position;

        // replace ground plane
        this.scene.remove(this.editorGround);
        this.editorGround.geometry.dispose();
        this.editorGround.material.dispose();
        this.editorGround = new THREE.Mesh(
            new THREE.PlaneGeometry(this.editorGridSize, this.editorGridSize),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.editorGround.rotation.x = -Math.PI / 2;
        this.editorGround.position.set(half, 0, half);
        this.editorGround.name = 'editor-ground';
        this.scene.add(this.editorGround);
    }

    editorRemoveBlock(x, y, z){
        const key = `${x},${y},${z}`;
        const entry = this.editorBlocks.get(key);
        if(!entry) return;
        const block = entry.mesh;
        this.editorBlocks.delete(key);
        block.disableRaycast = true;
        this.transitions.push(new Transition(block, 'scale', 0.0, 1.0, 'out', 3.0, ()=>{
            block.geometry.dispose();
            this.disposeMaterials(block);
            this.scene.remove(block);
        }));
    }

    editorColorBlock(x, y, z){
        const key = `${x},${y},${z}`;
        const entry = this.editorBlocks.get(key);
        if(!entry) return;
        const color = document.getElementById('editor-color').value;
        entry.color = color;
        entry.mesh.material.color.set(new THREE.Color(color));
        this.transitions.push(new Transition(entry.mesh, 'scale', 1.05, 1.0, 'in'));
    }

    // calculate bounding box of all placed blocks
    editorGetBounds(){
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for(const key of this.editorBlocks.keys()){
            const [x, y, z] = key.split(',').map(Number);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
        }
        return { minX, minY, minZ, maxX, maxY, maxZ };
    }

    editorGenerateLvl(){
        if(this.editorBlocks.size === 0) return null;
        const { minX, minY, minZ, maxX, maxY, maxZ } = this.editorGetBounds();
        const sx = maxX - minX + 1;
        const sy = maxY - minY + 1;
        const sz = maxZ - minZ + 1;
        let lines = [`${sx} ${sy} ${sz}`];

        for(let y = minY; y <= maxY; y++){
            for(let z = minZ; z <= maxZ; z++){
                let blockLine = '';
                let colors = [];
                for(let x = minX; x <= maxX; x++){
                    const key = `${x},${y},${z}`;
                    const entry = this.editorBlocks.get(key);
                    if(entry){
                        blockLine += '1';
                        colors.push(entry.color || '#ffffff');
                    } else {
                        blockLine += '0';
                    }
                }
                if(colors.length > 0){
                    blockLine += ' ' + colors.join(';');
                }
                lines.push(blockLine);
            }
        }
        return lines.join('\n');
    }

    editorTest(){
        const lvlContent = this.editorGenerateLvl();
        if(!lvlContent) return;

        const blob = new Blob([lvlContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // clean up editor scene
        for(const [key, entry] of this.editorBlocks){
            entry.mesh.geometry.dispose();
            this.disposeMaterials(entry.mesh);
            this.scene.remove(entry.mesh);
        }
        this.editorBlocks.clear();
        if(this.editorGround){
            this.scene.remove(this.editorGround);
            this.editorGround.geometry.dispose();
            this.editorGround.material.dispose();
            this.editorGround = undefined;
        }

        this.editorUI.classList.remove('show');
        this.currentMode = MODES.MENU;
        this.level = undefined;
        this.switchMode(MODES.PLAYING, url);
    }

    editorExport(){
        const content = this.editorGenerateLvl();
        if(!content) return;
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'level.lvl';
        a.click();
        URL.revokeObjectURL(a.href);
    }
}

const game = new Game(MODES.MENU);
game.run();