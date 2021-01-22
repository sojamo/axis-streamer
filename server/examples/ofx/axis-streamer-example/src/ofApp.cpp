#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
    // listen on the given port
    cout << "listening for osc messages on port " << PORT << "\n";
    receiver.setup( PORT );
    ofBackground( 30, 30, 130 );
}

//--------------------------------------------------------------
void ofApp::update(){

    // check for waiting messages,
    // evaluate and parse
    
    while( receiver.hasWaitingMessages() )
    {
        // get the next message
        ofxOscMessage m;
        receiver.getNextMessage( m );

        
        if(m.getAddress() == "/pn/1/all/position/absolute") {
            int numOfCoordinates = m.getNumArgs()/3;
            if(numOfCoordinates <= NUM_COORDINATES_EXPECTED) {
                int n = 0;
                for ( int i = 0; i<m.getNumArgs(); i += 3 ) {
                    nxyz[n][0] = m.getArgAsFloat(i + 0);
                    nxyz[n][1] = m.getArgAsFloat(i + 1);
                    nxyz[n][2] = m.getArgAsFloat(i + 2);
                    n++;
                }
            }
            
            #ifdef IS_LOG_MESSAGES
            cout << "received osc messages (position/absolute) on port " <<
                PORT << " " << m.getNumArgs() << "/" << numOfCoordinates <<
                " "<< ofGetSystemTimeMillis() << "\n";
            #endif
        }
    }
    
    // interpolate between latest coordinates received
    // and current xyz coordinates
    float s = 0.1f;
    for(int i=0;i<NUM_COORDINATES_EXPECTED;i++) {
        xyz[i][0] += (nxyz[i][0] - xyz[i][0]) * s;
        xyz[i][1] += (nxyz[i][1] - xyz[i][1]) * s;
        xyz[i][2] += (nxyz[i][2] - xyz[i][2]) * s;
    }
}


//--------------------------------------------------------------
void ofApp::draw(){
    ofBackground(0, 0, 0 );

    ofPushMatrix();
    ofTranslate(ofGetWidth() * 0.5f, ofGetHeight() * 0.75f);
    ofSetColor(255);
    ofFill();
    for(int i = 0; i < NUM_COORDINATES_EXPECTED; i++) {
        ofPushMatrix();
        ofTranslate(xyz[i][0], xyz[i][1], xyz[i][2]);
        ofDrawEllipse(0, 0, 4, 4);
        ofPopMatrix();
    }
    ofPopMatrix();
}


//--------------------------------------------------------------
void ofApp::keyPressed  (int key){

}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y ){

}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){
}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){

}
