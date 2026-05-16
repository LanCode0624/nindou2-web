package nindou_weapon_19_fla
{
   import adobe.utils.*;
   import flash.accessibility.*;
   import flash.desktop.*;
   import flash.display.*;
   import flash.errors.*;
   import flash.events.*;
   import flash.external.*;
   import flash.filters.*;
   import flash.geom.*;
   import flash.globalization.*;
   import flash.media.*;
   import flash.net.*;
   import flash.net.drm.*;
   import flash.printing.*;
   import flash.profiler.*;
   import flash.sampler.*;
   import flash.sensors.*;
   import flash.system.*;
   import flash.text.*;
   import flash.text.engine.*;
   import flash.text.ime.*;
   import flash.ui.*;
   import flash.utils.*;
   import flash.xml.*;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol1089")]
   public dynamic class O_1_1 extends MovieClip
   {
      
      public var mcNJ:MovieClip;
      
      public var eye:int;
      
      public function O_1_1()
      {
         super();
         addFrameScript(0,this.frame1);
      }
      
      internal function frame1() : *
      {
         this.eye = Math.floor(Math.random() * 42) + 1;
         this.mcNJ.mcEye1.gotoAndStop(this.eye);
         this.mcNJ.mcEye2.gotoAndStop(this.eye);
      }
   }
}

