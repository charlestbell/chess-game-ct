import * as THREE from "three";
import { heroItems, tileSize } from "../../utils/constant";

import iceWall from "../../assets/img/items/iceWall.png";
import petrify from "../../assets/img/items/petrify.png";
import jumpyShoe from "../../assets/img/items/jumpyShoe.png";
import springPad from "../../assets/img/items/springPad.png";
import thunderstorm from "../../assets/img/items/thunderstorm.png";

import { ang2Rad, getMatrixIndexFromFen } from "../../utils/helper";

export const handleItemInfo = (params) => {
  if (params.randomItems) {
    if (this.itemMeshes) {
      for (let i = 0; i < this.itemMeshes.length; i++) {
        this.scene.remove(this.itemMeshes[i].mesh);
      }
    }

    this.randomItems = params.randomItems;

    this.itemMeshes = [];
    this.randomItems.forEach((item) => {
      const newMesh = {};
      newMesh.position = item.position;
      newMesh.type = item.type;

      if (newMesh.type !== heroItems["thunderstorm"]) {
        let texture;
        if (newMesh.type === heroItems["iceWall"]) {
          texture = new THREE.TextureLoader().load(iceWall);
        } else if (newMesh.type === heroItems["petrify"]) {
          texture = new THREE.TextureLoader().load(petrify);
        } else if (newMesh.type === heroItems["jumpyShoe"]) {
          texture = new THREE.TextureLoader().load(jumpyShoe);
        } else if (newMesh.type === heroItems["springPad"]) {
          texture = new THREE.TextureLoader().load(springPad);
        } else if (newMesh.type === heroItems["thunderstorm"]) {
          texture = new THREE.TextureLoader().load(thunderstorm);
        }

        const itemGeo = new THREE.PlaneBufferGeometry(0.8, 0.8, 100, 100);
        const itemMaterial = new THREE.MeshStandardMaterial({
          side: THREE.DoubleSide,
          roughness: 1,
          metalness: 0,
          refractionRatio: 0,
          map: texture,
          transparent: true,
        });
        const itemMesh = new THREE.Mesh(itemGeo, itemMaterial);

        itemMesh.rotateX(ang2Rad(this.side === "white" ? -90 : 90));
        itemMesh.rotateY(ang2Rad(this.side === "white" ? 0 : 180));

        const itemIndex = getMatrixIndexFromFen(newMesh.position);
        itemMesh.position.set(
          itemIndex.colIndex * tileSize - tileSize * 3.5,
          0.6,
          -(itemIndex.rowIndex * tileSize - tileSize * 3.5)
        );

        this.scene.add(itemMesh);

        newMesh.mesh = itemMesh;

        this.itemMeshes.push(newMesh);
      }
    });
  }
  if (params.userItems) {
    const myItems = params.userItems[this.socket.id];
    this.setState({
      myItems: myItems,
    });
  }

  if (params.obstacleArray) {
    this.setObstacles(params.obstacleArray);
  }
};
