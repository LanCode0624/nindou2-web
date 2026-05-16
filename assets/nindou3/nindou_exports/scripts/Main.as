package
{
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public class Main extends MovieClip
   {
      
      public var btnReplay:SimpleButton;
      
      public function Main()
      {
         super();
         this.btnReplay.addEventListener(MouseEvent.CLICK,this.onClick);
      }
      
      private function replay() : void
      {
         var _loc1_:MovieClip = this.getChildAt(0) as MovieClip;
         MovieClip(_loc1_.getChildAt(4)).gotoAndPlay(1);
         MovieClip(_loc1_.getChildAt(3)).gotoAndPlay(1);
      }
      
      private function onClick(param1:MouseEvent) : void
      {
         this.replay();
      }
   }
}

