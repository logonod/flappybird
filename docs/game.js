/**
 * The base class for Agents.
 * Wrap and hide the game information from agents.
 */
class BaseAgent {
    /**
     * Initializes a new instance of the BaseAgent class.
     * @param game the game instance
     */
    constructor(game) {
        this.game = game;
    }
    click() {
        this.game.click();
    }
    getScore() {
        return this.game.score;
    }
    getBirdHeight() {
        return this.game.bird.height;
    }
    getBirdVelocity() {
        return this.game.bird.velocity;
    }
    getPipeRelativePosition() {
        let anchor = null;
        for (let pipe of this.game.pipes) {
            let tmp = pipe.getAnchor();
            if (tmp[0] > Configs.birdOffset - Configs.birdRadius) {
                if (anchor == null || anchor[0] > tmp[0]) {
                    anchor = tmp;
                }
            }
        }
        if (anchor == null) {
            anchor = [Configs.width, Configs.height / 2];
        }
        return [anchor[0] - Configs.birdOffset, anchor[1] - this.game.bird.height];
    }
    isAlive() {
        if (this.game.state == GameState.EndGame) {
            return false;
        }
        else {
            return true;
        }
    }
}
/**
 * The default agent for human to play games.
 */
class Agent extends BaseAgent {
    /**
     * Initializes a new instance of the Agent class.
     * @param game the game instance
     */
    constructor(game) {
        super(game);
    }
}
class AiAgent extends BaseAgent {
    constructor(game, data) {
        super(game);
        this.ai = new QLearning(data);
        this.time = new Date();
    }
    getCurrentState() {
        let state = [this.getBirdHeight(), this.getBirdVelocity(), 0, 0];
        let pipePos = this.getPipeRelativePosition();
        state[2] = pipePos[0];
        state[3] = pipePos[1];
        return state;
    }
    dump() {
        return this.ai.dump();
    }
    update() {
        let time = new Date();
        this.time = time;
        let state = this.getCurrentState();
        if (this.isAlive()) {
            let reward = 0;
            let action = this.ai.getAction(state);
            let pipePos = this.getPipeRelativePosition();
            let delta = Math.abs(pipePos[1]);
            if (delta < Configs.pipeHeight / 2) {
                // reward = 1;
            }
            if (this.getScore() > this.lastScore) {
                reward = 1024;
                this.lastScore = this.getScore();
            }
            if (this.lastState != null) {
                this.ai.update(this.lastState, this.lastAction, state, reward);
            }
            this.lastState = state;
            this.lastAction = action;
            if (action) {
                this.click();
            }
        }
        else {
            this.lastScore = 0;
            if (this.lastState != null) {
                this.ai.update(this.lastState, this.lastAction, state, -1024);
            }
            this.lastState = null;
            this.lastAction = null;
            this.click();
        }
    }
}
class QLearning {
    constructor(data) {
        // JSON.stringify([...this.values])
        // new Map();
        // 
        this.values = new Map(JSON.parse(data));
    }
    dump() {
        return JSON.stringify([...this.values]);
    }
    getPolicy(state) {
        return this.computeActionFromQValues(state);
    }
    update(state, action, nextState, reward) {
        if (!Configs.learn) {
            return;
        }
        let qvalue = reward + Configs.discount * this.getValue(nextState);
        qvalue = (1 - Configs.alpha) * this.getQValue(state, action) + Configs.alpha * qvalue;
        this.setQValue(state, action, qvalue);
    }
    getKey(state, action) {
        let key = (action ? "t" : "f");
        key += "," + Math.round(state[0] / 100); // height
        key += "," + Math.round(state[1]);
        key += "," + Math.round(this.getMagicNumber(state[2], 100) / 25); //
        key += "," + Math.round(this.getMagicNumber(state[3], 90) / 9);
        //key += "," + Math.round(Math.log(state[2]));
        //key += ","
        if (state[3] < 0) {
            //key += "-"
        }
        //key += Math.round(Math.abs(state[3])/8);
        return key;
    }
    getMagicNumber(value, base) {
        let poz = 1;
        let abs = Math.abs(value);
        if (value < 0) {
            poz = -1;
        }
        if (abs <= base) {
            return value;
        }
        return poz * Math.log(Math.abs(value) / base * Math.E) * base;
    }
    setQValue(state, action, value) {
        let key = this.getKey(state, action);
        this.values.set(key, Number(value.toPrecision(8)));
    }
    getQValue(state, action) {
        let key = this.getKey(state, action);
        if (this.values.has(key)) {
            if (state[2] < 200) {
                //console.log(key + ":" + this.values.get(key));
            }
            // console.log(key + ":" + this.values.get(key));
            return this.values.get(key);
        }
        //console.log(key + ":" + 0);
        return 0;
    }
    computeValueFromQValues(state) {
        var qValueTrue = this.getQValue(state, true);
        var qValueFalse = this.getQValue(state, false);
        return Math.max(qValueTrue, qValueFalse, 0);
    }
    computeActionFromQValues(state) {
        var qValueTrue = this.getQValue(state, true);
        var qValueFalse = this.getQValue(state, false);
        if (qValueFalse > qValueTrue) {
            return false;
        }
        if (qValueFalse < qValueTrue) {
            return true;
        }
        return Math.random() < 0.1;
        // TODO: random choose when equal
    }
    getAction(state) {
        Math.random();
        if (Util.flipCoin(Configs.epsilon)) {
            return Math.random() < 0.1;
        }
        else {
            return this.computeActionFromQValues(state);
        }
    }
    getValue(state) {
        return this.computeValueFromQValues(state);
    }
}
class Assets {
    static initialize() {
        this.img_altas.src = 'assets/atlas.png';
        this.img_rainbow.src = 'assets/rainbow.png';
        this.map_altas = new Map(JSON.parse(this.data_altas));
    }
    static playSoundWing() {
        this.sfx_wing.play();
    }
    static playSoundHit() {
        Assets.sfx_hit.play();
    }
    static playSoundPoint() {
        Assets.sfx_point.play();
    }
    static playSoundMarioJump() {
        Assets.mario_jump.play();
    }
    static drawBackground(context, score) {
        let alta = this.map_altas.get('bg_day');
        context.drawImage(this.img_altas, alta[0], alta[1], alta[2], alta[3], 0, 0, alta[2], Configs.height);
        context.drawImage(this.img_altas, alta[0], alta[1], alta[2], alta[3], alta[2], 0, alta[2], Configs.height);
        context.drawImage(this.img_altas, alta[0], alta[1], alta[2], alta[3], alta[2] * 2, 0, alta[2], Configs.height);
        if (score > 20 && (score % 5 == 0)) {
            context.drawImage(this.img_rainbow, Configs.width / 2, 100, 200, 100);
        }
    }
    static drawPipe(context, offset, upper) {
        let pipe_down = this.map_altas.get('pipe_down');
        let pipe_up = this.map_altas.get('pipe_up');
        //,["pipe_down",[112,646,52,320]],["pipe_up",[168,646,52,320]]
        context.drawImage(this.img_altas, pipe_down[0], pipe_down[1], pipe_down[2], pipe_down[3], offset, upper - pipe_down[3] * 2, pipe_down[2] * 2, pipe_down[3] * 2);
        context.drawImage(this.img_altas, pipe_up[0], pipe_up[1], pipe_up[2], pipe_up[3], offset, upper + Configs.pipeHeight, pipe_up[2] * 2, pipe_up[3] * 2);
    }
    static drawBird(context, height, velocity) {
        let bird = this.map_altas.get('bird0_0');
        var x = Configs.width / 2;
        var y = Configs.height / 2;
        let ang = 10;
        context.save(); //saves the state of canvas
        context.translate(Configs.birdOffset, height); //let's translate
        context.rotate(Math.atan2(velocity, 7.5)); //increment the angle and rotate the image 
        context.drawImage(this.img_altas, bird[0], bird[1], bird[2], bird[3], 0 - bird[3], 0 - bird[3], bird[2] * 2, bird[3] * 2);
        context.restore(); //restore the state of canvas
    }
    static drawScore(context, score) {
        //context.font="30px Arial";
        //context.fillStyle = 'blue';
        //context.fillText(score + "",10,40);
        let scores = [];
        for (let i = 3; i >= 0; i--) {
            scores[i] = score % 10;
            score = Math.floor(score / 10);
        }
        for (let i = 0; i < 4; i++) {
            let alta = this.map_altas.get('font_0' + (48 + scores[i]));
            context.drawImage(this.img_altas, alta[0], alta[1], alta[2], alta[3], (i + 1) * 28 - alta[2] / 2 - 12, 0, alta[2], alta[3]);
        }
    }
}
Assets.sfx_wing = new Audio('assets/sfx_wing.ogg');
Assets.sfx_hit = new Audio('assets/sfx_hit.ogg');
Assets.sfx_point = new Audio('assets/sfx_point.ogg');
Assets.mario_jump = new Audio('assets/mario_jump.ogg');
Assets.img_altas = new Image(1024, 1024);
Assets.data_altas = '[["bg_day",[0,0,288,512]],["bg_night",[292,0,288,512]],["bird0_0",[0,970,48,48]],["bird0_1",[56,970,48,48]],["bird0_2",[112,970,48,48]],["bird1_0",[168,970,48,48]],["bird1_1",[224,646,48,48]],["bird1_2",[224,698,48,48]],["bird2_0",[224,750,48,48]],["bird2_1",[224,802,48,48]],["bird2_2",[224,854,48,48]],["black",[584,412,32,32]],["blink_00",[276,682,10,10]],["blink_01",[276,734,10,10]],["blink_02",[276,786,10,10]],["brand_copyright",[884,182,126,14]],["button_menu",[924,52,80,28]],["button_ok",[924,84,80,28]],["button_pause",[242,612,26,28]],["button_play",[702,234,116,70]],["button_rate",[924,0,74,48]],["button_resume",[668,284,26,28]],["button_score",[822,234,116,70]],["button_share",[584,284,80,28]],["font_048",[992,116,24,44]],["font_049",[272,906,16,44]],["font_050",[584,316,24,44]],["font_051",[612,316,24,44]],["font_052",[640,316,24,44]],["font_053",[668,316,24,44]],["font_054",[584,364,24,44]],["font_055",[612,364,24,44]],["font_056",[640,364,24,44]],["font_057",[668,364,24,44]],["land",[584,0,336,112]],["medals_0",[242,516,44,44]],["medals_1",[242,564,44,44]],["medals_2",[224,906,44,44]],["medals_3",[224,954,44,44]],["new",[224,1002,32,14]],["number_context_00",[276,646,12,14]],["number_context_01",[276,664,12,14]],["number_context_02",[276,698,12,14]],["number_context_03",[276,716,12,14]],["number_context_04",[276,750,12,14]],["number_context_05",[276,768,12,14]],["number_context_06",[276,802,12,14]],["number_context_07",[276,820,12,14]],["number_context_08",[276,854,12,14]],["number_context_09",[276,872,12,14]],["number_context_10",[992,164,12,14]],["number_score_00",[272,612,16,20]],["number_score_01",[272,954,16,20]],["number_score_02",[272,978,16,20]],["number_score_03",[260,1002,16,20]],["number_score_04",[1002,0,16,20]],["number_score_05",[1002,24,16,20]],["number_score_06",[1008,52,16,20]],["number_score_07",[1008,84,16,20]],["number_score_08",[584,484,16,20]],["number_score_09",[620,412,16,20]],["pipe2_down",[0,646,52,320]],["pipe2_up",[56,646,52,320]],["pipe_down",[112,646,52,320]],["pipe_up",[168,646,52,320]],["score_panel",[0,516,238,126]],["text_game_over",[784,116,204,54]],["text_ready",[584,116,196,62]],["title",[702,182,178,48]],["tutorial",[584,182,114,98]],["white",[584,448,32,32]]]';
Assets.img_rainbow = new Image(100, 50);
Assets.initialize();
class GameEngine {
    constructor() {
        this.sprites = [];
        this.time = new Date();
    }
    render(context) {
        let time = new Date();
        let delta = (time.getTime() - this.time.getTime());
        if (delta > 100) {
            delta = 100;
        }
        if (delta < 15) {
            delta = 15;
        }
        this.tick(delta);
        for (let sprite of this.sprites) {
            sprite.tick(delta);
        }
        this.time = time;
        this.renderBackground(context);
        for (let sprite of this.sprites) {
            sprite.render(context);
        }
        this.renderForeground(context);
    }
    emulate(delta) {
        this.tick(delta);
        for (let sprite of this.sprites) {
            sprite.tick(delta);
        }
    }
}
class Bird {
    constructor() {
        this.offset = 0;
        this.height = 0;
        this.velocity = 0;
        this.offset = Configs.birdOffset;
    }
    jump() {
        this.velocity = Configs.birdJumpSpeed;
        Assets.playSoundWing();
    }
    reset() {
        this.velocity = 0;
        this.height = Configs.height / 2;
    }
    tick(delta) {
        let velocityDelta = delta * Configs.birdGravityConstant;
        this.height += (this.velocity + (velocityDelta / 2)) * delta * Configs.birdSpeed;
        this.velocity += velocityDelta;
    }
    render(context) {
        var radius = Configs.birdRadius;
        //context.beginPath();
        //context.arc(300, this.height, radius, 0, 2 * Math.PI, false);
        //context.fillStyle = 'yellow';
        //context.fill();
        //context.lineWidth = 5;
        //context.strokeStyle = '#003300';
        //context.stroke();
        Assets.drawBird(context, this.height, this.velocity);
    }
}
var Configs;
(function (Configs) {
    Configs.epsilon = 0.5;
    Configs.learn = true;
    Configs.agentInterval = 25;
    Configs.discount = 0.8;
    Configs.alpha = 0.01;
    Configs.width = 768;
    Configs.height = 512;
    Configs.pipeWidth = 104;
    Configs.pipeHeight = 180;
    Configs.pipeSpeed = 0.25;
    Configs.pipeInterval = 1500;
    Configs.birdOffset = 300;
    Configs.birdSpeed = 0.125;
    Configs.birdJumpSpeed = -5;
    Configs.birdGravityConstant = 0.02;
    Configs.birdRadius = 28;
})(Configs || (Configs = {}));
class Emulator {
    static run(data, dailyDump) {
        let timestamp = 0;
        let lastGameTick = 0;
        let nextGameTick = 0;
        let nextAgentTick = 0;
        let game = new Game();
        let agent = new Agent(game);
        let ai = new AiAgent(game, data);
        let counter = 0;
        while (true) {
            if (nextGameTick == timestamp) {
                nextGameTick = timestamp + Math.round(Math.random() * 5) + 15;
                game.emulate(timestamp - lastGameTick);
                lastGameTick = timestamp;
            }
            if (nextAgentTick == timestamp) {
                nextAgentTick = timestamp + Math.round(Math.random() * 4) + Configs.agentInterval - 2;
                ai.update();
            }
            if (timestamp % (1000 * 60 * 60 * 24) == 0) {
                counter++;
                console.log(counter);
                dailyDump(ai.dump());
                // var fs = require('fs');
                // fs.writeFileSync("C:\\Users\\Windows\\Desktop\\FAI\\dump.txt", ai.dump());
            }
            timestamp++;
        }
    }
}
/// <reference path="./base.ts" />
var GameState;
(function (GameState) {
    GameState[GameState["None"] = 0] = "None";
    GameState[GameState["InGame"] = 1] = "InGame";
    GameState[GameState["EndGame"] = 2] = "EndGame";
})(GameState || (GameState = {}));
class Game extends GameEngine {
    constructor() {
        super();
        this.state = GameState.InGame;
        this.timestamp = 0;
        this.bird = new Bird();
        this.pipes = [];
        this.score = 0;
        this.sprites.push(this.bird);
    }
    click() {
        this.bird.jump();
        if (this.state == GameState.EndGame) {
            this.state = GameState.InGame;
        }
    }
    renderBackground(context) {
        Assets.drawBackground(context, this.score);
    }
    renderForeground(context) {
        Assets.drawScore(context, this.score);
    }
    tick(delta) {
        if (this.state != GameState.InGame) {
            this.bird.reset();
            return;
        }
        let old_timestamp = this.timestamp;
        this.timestamp += delta;
        let pipes = [];
        if (Math.round(old_timestamp / Configs.pipeInterval) < Math.round(this.timestamp / Configs.pipeInterval)) {
            //if (Math.random() > 0.1) {
            let pipe = new Pipe();
            pipes.push(pipe);
            //}
        }
        for (let pipe of this.pipes) {
            if (pipe.offset < -200) {
            }
            else if (pipe.checkCollision(this.bird)) {
                Assets.playSoundHit();
                this.bird.reset();
                this.score = 0;
                this.state = GameState.EndGame;
            }
            else {
                pipes.push(pipe);
            }
        }
        for (let pipe of pipes) {
            if (pipe.offset + Configs.pipeWidth + Configs.birdRadius < this.bird.offset && pipe.pass == false) {
                pipe.pass = true;
                this.score++;
                Assets.playSoundPoint();
            }
        }
        if (this.bird.height - Configs.birdRadius < 0 || this.bird.height + Configs.birdRadius > Configs.height) {
            Assets.playSoundHit();
            this.bird.reset();
            this.score = 0;
            this.state = GameState.EndGame;
        }
        this.pipes = pipes;
        this.sprites = this.pipes.slice();
        this.sprites.push(this.bird);
    }
}
class Pipe {
    constructor() {
        this.offset = Configs.width;
        this.width = Configs.pipeWidth;
        this.height = Configs.pipeHeight;
        this.pass = false;
        this.upper = (Math.random() * Configs.height / 2) + Configs.height / 4 - Configs.pipeHeight / 2;
    }
    tick(delta) {
        this.offset -= delta * Configs.pipeSpeed;
    }
    render(context) {
        //context.beginPath();
        //context.rect(this.offset, 0, this.width, this.upper);
        //context.rect(this.offset, this.upper + this.height, this.width, Configs.height);
        //context.fillStyle = 'green';
        //context.fill();
        Assets.drawPipe(context, this.offset, this.upper);
    }
    checkCollision(bird) {
        if (bird.offset + Configs.birdRadius > this.offset && bird.offset - Configs.birdRadius < this.offset + this.width) {
            if (bird.height - Configs.birdRadius < this.upper || bird.height + Configs.birdRadius > this.upper + this.height) {
                return true;
            }
        }
        return false;
    }
    getAnchor() {
        return [this.offset + Configs.pipeWidth, this.upper + Configs.pipeHeight / 2];
    }
}
class Util {
    static flipCoin(epsilon) {
        if (Math.random() < epsilon) {
            return true;
        }
        return false;
    }
}
