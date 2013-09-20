// enforce strict/clean programming
"use strict"; 

function Sphere(){
	//private
	var vx;
	var vy;
	var vz;
	
	//public
	this.x;
	this.y;
	this.z;
	//Server values of this sphere
	this.serverVX;
	this.serverVY;
	this.serverVZ;
	this.serverX;
	this.serverY;
	this.serverZ;
	
	//constructors
	var that = this;
	
	//priviledged method
	//Used to set the current position of the Sphere, should only be used when creating the sphere at the start
	this.setPosition = function(sx,sy){
		that.x = sx;
		that.y = sy;
	}
	
	//priviledged method
	//Used to set the velocity of this sphere, 
	this.setVelocity = function(nx,ny,nz){
		vx = nx;
		vy = ny;
		vz = nz;
	}
	
	//priviledged method
	//Used to test if this sphere is colliding with another sphere
	this.isColliding = function(anotherSphere){
		//TODO: could be already inside library
		var dx = Math.abs(that.x - anotherSphere.x);
		var dy = Math.abs(that.y - anotherSphere.y);
		var dz = Math.abs(that.z - anotherSphere.z);
		
		if(dx < Sphere.DIAMETER && dy < Sphere.DIAMETER && dz < Sphere.DIAMETER){
			return true;
		}else{
			return false;
		}
	}
	
	//priviledged method
	//Called periodically to animate the movement of the sphere according to velocity input by clients
	this.animateNext = function(){
		//try to converge here
		that.x += vx;
		that.y += vy;
		that.z += vz;
	}
}


//Static variables
Sphere.DIAMETER = 20;