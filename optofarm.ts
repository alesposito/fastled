/* OptoTimeBase 
** Enumerate the time base used for optogenetics assays
** as multiple of one minute
*/
enum OptoTimeBase {
    //%block="s"
    s = 1,
    //%block="min"
    min = 60,
    //%block='hr'
    hr = 3600,
    //%block='day'
    day = 86400
}

/* OptoColour
** Enumerate the colours available in the OptoFarm.
** Currently, only the RGB emitters of neopixels are supported
** but other emitters will be added in the future. Therefore, 
** to future proof this development we provide already a four emitter
** support referenced as blue, green, red and near infrared or B, G, R, N.
** However, N is not used as yet. 
*/
enum OptoColour {
    //%block='B'
    B = 1,
    //%block='G'
    G = 2,
    //%block='R'
    R = 3,
    //%block='N'
    N = 4
}

// OptoFarm namespace
//% weight=100 color=#c7ea46 icon="\uf1b3"
namespace Optogenetics {

    // OptoFarm class - the main hardware object
    // Currently driving several identical pods/wells 
    export class OptoFarm {
        LEDs: neopixel.Strip; // currently working with neopixel LEDs chains. 
        npods: number; //number of pods/wells
        lpp: number; // leds per pod

        //% blockId="optofarm_set_pod" 
        //% block="Set %optofarm pod %podid brigthenss %bri and %rgb=neopixel_colors" 
        //% blockGap=8 weight=80
        //% parts="neopixel" advanced=false
        setPod(podid: number, bri: number, rgb: number): void {

            let nleds = this.GetLedsPerPod();
            let led0 = mapPod2Led(podid, this);

            for (let index = led0; index < led0 + nleds; index++) {
                this.LEDs.setPixelColor(index, packRGB(bri*unpackR(rgb/100),bri*unpackG(rgb)/100,bri*unpackB(rgb)/100));
            }
            this.LEDs.show();
            
        } // setPod end

        //% blockId="optofarm_reset" block="Reset/init %optofarm" 
        //% blockGap=8
        //% weight=80
        reset() {
            this.LEDs.clear();
            this.LEDs.show();
        }

        /**
        * Gets the number of pixels declared on the strip
        */
        //% blockId="optofarm_get_ledsperpod" block="%optofarm|leds per pod" blockGap=8
        //% weight=60 advanced=false
        GetLedsPerPod() {
            return this.lpp;
        }

        // @AE have to handle the color 
        // @AE haev to handle the pod id, and different pods
        //% blockId="optofarm_execute" 
        //% block="Execute %optofarm | %protocol |step %step"
        ExecuteStep(protocol: LightProtocol, step: number) {
            for ( let index=0; index<protocol.podid.length; index++){
                this.setPod(protocol.podid.get(index), protocol.brightness.get(step), NeoPixelColors.Blue);
            };
            basic.pause(protocol.time.get(step) * 60000);
        }


    } // end OptoFarm class

    // light protocol class
    export class LightProtocol {

        // Light Protocol Properties
        time: Array<number>;
        brightness: Array<number>;
        color: Array<number>;
        podid: Array<number>;

        // Allocate memory
        constructor(time: Array<number>, brightness: Array<number>, color: Array<number>, podid: Array<number>) {
            this.time = time;
            this.brightness = brightness;
            this.color = color;
            this.podid = podid;
        }

        // Light Protocol Methods
        
        //% blockId="optofarm_protocol_length" 
        //% block="%this length"
        Length(): number {
            return this.time.length
        }

        //% blockId="optofarm_addpulse" 
        //% block="Add to %LightProtocol after %p  a pulse of %w brightness %b and color %c || %r times  |on %pods pods"
        //% inlineInputMode=inline
        AddPulse(p: number, w: number, b: number, c: OptoColour, r: number, pods: Array<number>) {
            
            for (let i = 0; i < r; i++) {
                // initial delay
                this.time.push(p)
                this.brightness.push(0)
                this.color.push(0)

                // pulse
                this.time.push(w)
                this.brightness.push(b)
                this.color.push(c)
            };

            this.podid = pods;

        }
    } // light protocol class end


    //% blockId=optofarm_pod_map block="map pod %podid to led for %farmid"
    //% inlineInputMode=inline
    export function mapPod2Led(podid: number, farmid: OptoFarm): number {
        return podid * farmid.GetLedsPerPod();
    }

    // CREATE OPTOFARM INSTANCE
    //% blockId="optofarm_create" 
    //% block="LEDs strip %LEDs | n pods %npods and | %nleds leds per pod"
    //% weight=90 blockGap=8
    //% blockSetVariable=OptoFarm
    export function create(LEDs: neopixel.Strip, npods: number, nleds: number): OptoFarm {
        let optofarm = new OptoFarm()
        optofarm.LEDs = LEDs;
        optofarm.lpp = nleds;
        optofarm.npods = npods;
        optofarm.reset();
        return optofarm;
    }

    // CREATE LIGHT PROTOCOL INSTANCE
    //% blockId="optofarm_create_protocol"
    //% block="new light protocol"
    //% weight=1 blockGap=8
    //% blockSetVariable=Protocol
    export function CreateProtocol(): LightProtocol {
        let protocol = new LightProtocol([], [], [], [])
        return protocol;
    }

    //% blockId="optofarm_input_time"
    //% block="%value %unit"
    //% weight=2 blockGap=8
    export function input_time(value: number, unit: OptoTimeBase): number {
        return value * unit / 60;
    }

}



    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }