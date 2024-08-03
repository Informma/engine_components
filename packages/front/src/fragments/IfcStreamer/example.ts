/* MD
### 🐳 Let's go BIG
---

Opening big BIM models is not easy, especially if we are in a browser or in devices that are not so powerful. In this tutorial, we'll learn how to do it using streaming, which allows to open gigabytes of data in seconds on any device.

:::tip Streaming?

Streaming consists of converting the IFC file to "tiles", and then loading only the data that the user sees. If you haven't heard of streaming before, check out the geometry tiles and property tiles tutorials first!

:::

In this tutorial, we will import:

- `@thatopen/components` to set up the barebone of our app.
- `@thatopen/components-front` to use some frontend-oriented components.
- `Stats.js` (optional) to measure the performance of our app.
*/

import Stats from "stats.js";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";

/* MD
  ### 🌎 Setting up a simple scene
  ---

  We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial. Notice how we use the PostproductionRenderer in this case.
*/

const container = document.getElementById("container")!;

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();

world.scene.setup();

world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

const grids = components.get(OBC.Grids);
grids.create(world);

/* MD

  We'll make the background of the scene transparent so that it looks good in our docs page, but you don't have to do that in your app!

*/

world.scene.three.background = null;

/* MD
  ### 🧰 Getting the streamer
  ---

  Now we are ready to start streaming a BIM model. We have already a bunch of tiles prepared in our repository as example, but you can also convert your own IFC to tiles (check the geometry and property tiles tutorials for more information). First, let's get an instance of the IFC streamer:

*/

const loader = components.get(OBCF.IfcStreamer);
loader.world = world;
loader.dbCleaner.enabled = false;

/* MD
Now, we need to set the base URL where the streamer needs to look for the tiles. In our case, we'll use the tiles we have prepared in our repository, but this should also work with your own backend.
*/

loader.url =
  "/resources/Stream001/";

/* MD
  ### 📺 Streaming the model
  ---

  Now we'll create a function that will stream the given model. We will also allow to stream the properties optionally. 

*/

async function loadModel(geometryURL: string, propertiesURL?: string) {
  const rawGeometryData = await fetch(geometryURL);
  const geometryData = await rawGeometryData.json();
  let propertiesData;
  if (propertiesURL) {
    const rawPropertiesData = await fetch(propertiesURL);
    propertiesData = await rawPropertiesData.json();
  }

  const model = await loader.load(geometryData, true, propertiesData);
  console.log(model);
}

/* MD
  Next, let's call this function and start streaming our model right away!
*/

await loadModel(
   `${loader.url}small.ifc-processed.json`/*,
  "https://thatopen.github.io/engine_components/resources/streaming/small.ifc-processed-properties.json",*/
);

/* MD
  ### 🔄️ Updating the streamer
  ---

  Now, streaming works by updating the scene depending on the user's perspective and getting the necessary geometries from the backend. A simple way to achieve this is by updating the scene each time the user stops the camera:
*/

world.camera.controls.addEventListener("sleep", () => {
  loader.culler.needsUpdate = true;
});

/* MD
  ### 🧠 Stream cache
  ---

As you can imagine, downloading the geometries from the server each time can take time, especially for heavier geometries. This is why the stream loader automatically caches the files locally to get them much faster. This means that the loading experience the first time might be a bit slower, but then later it will be much better. You can control this using the `useCache` property and clear the cache using the `clearCache()` method:
*/

loader.useCache = true;

async function clearCache() {
  await loader.clearCache();
  window.location.reload();
}

/* MD
  ### ⚙️ Streaming config
  ---

You can also customize the loader through the `culler` property:
- Threshold determines how bit an object must be in the screen to stream it.
- maxHiddenTime determines how long an object must be lost to remove it from the scene.
- maxLostTime determines how long an object must be lost to remove it from memory.
*/

loader.culler.threshold = 1;
loader.culler.maxHiddenTime = 1000;
loader.culler.maxLostTime = 3000;
loader.culler.bboxThreshold = 1000;
//loader.culler.enabled = false;

/* MD
  ### ⏱️ Measuring the performance (optional)
  ---

  We'll use the [Stats.js](https://github.com/mrdoob/stats.js) to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.
*/

const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());

loader.culler.renderDebugFrame = true;
const debugFrame = loader.culler.renderer.domElement;
document.body.appendChild(debugFrame);
debugFrame.style.position = "fixed";
debugFrame.style.left = "0";
debugFrame.style.bottom = "0";
//debugFrame.style.visibility = "collapse";
/* MD
  ### 🎉 Wrap up
  ---

  This is it! Now you should be able to stream your own IFC models and open them anywhere, no matter how big they are! 💪 We will keep improving and making this API more powerful to handle any model on any device smoothly.
*/
