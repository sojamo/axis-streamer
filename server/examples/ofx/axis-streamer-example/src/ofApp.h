
#include "ofMain.h"
#include "ofxOsc.h"


// #define IS_LOG_MESSAGES


#define PORT 5000
#define NUM_COORDINATES_EXPECTED 24

//--------------------------------------------------------
class ofApp : public ofBaseApp{

    public:

        void setup();
        void update();
        void draw();
        void keyPressed  (int key);
        void mouseMoved(int x, int y );
        void mouseDragged(int x, int y, int button);
        void mousePressed(int x, int y, int button);
        void mouseReleased(int x, int y, int button);
        void windowResized(int w, int h);

        ofTrueTypeFont        font;


private:
        ofxOscReceiver      receiver;

        int                 current_msg_string;
        float               xyz[NUM_COORDINATES_EXPECTED][3];
        float               nxyz[NUM_COORDINATES_EXPECTED][3];
};
