import * as THREE from "three";
import { heroItems, tileSize, modelSize } from "../../utils/constant";

import iceWall from "../../assets/img/items/iceWall.png";
import petrify from "../../assets/img/items/petrify.png";
import jumpyShoe from "../../assets/img/items/jumpyShoe.png";
import springPad from "../../assets/img/items/springPad.png";
import thunderstorm from "../../assets/img/items/thunderstorm.png";

import {
  ang2Rad,
  getMatrixIndexFromFen,
  getMeshPosition,
} from "../../utils/helper";

export function handleItemInfo(params) {
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
}

export function handleSelectPiece(params) {
  const { fen, possibleMoves } = params;

  const matrixIndex = getMatrixIndexFromFen(fen);
  const meshIndex = this.boardPiecesArray.findIndex(
    (item) =>
      item.rowIndex === matrixIndex.rowIndex &&
      item.colIndex === matrixIndex.colIndex
  );

  this.selectPiece(this.boardPiecesArray[meshIndex]);

  if (this.side === this.currentTurn) {
    this.possibleMoves = possibleMoves;
  }
}

export function handlePerformMove(params) {
  const { from, to, castling, pieceType, enPassant } = params;

  const fromMatrixIndex = getMatrixIndexFromFen(from);
  const toMatrixIndex = getMatrixIndexFromFen(to);

  // Check chese piece on the target position: eat action performed at that time
  const toIndex = this.boardPiecesArray.findIndex(
    (item) =>
      item.rowIndex === toMatrixIndex.rowIndex &&
      item.colIndex === toMatrixIndex.colIndex
  );

  if (toIndex !== -1) {
    this.scene.remove(this.boardPiecesArray[toIndex].mesh);
    this.boardPiecesArray.splice(toIndex, 1);
  }

  // Move chese piece to the target position
  const fromIndex = this.boardPiecesArray.findIndex(
    (item) =>
      item.rowIndex === fromMatrixIndex.rowIndex &&
      item.colIndex === fromMatrixIndex.colIndex
  );

  // Enpassant case
  if (
    fromIndex !== -1 &&
    (this.boardPiecesArray[fromIndex].pieceType === "p" ||
      this.boardPiecesArray[fromIndex].pieceType === "P") &&
    to === enPassant
  ) {
    const targetMatrixIndex = { ...toMatrixIndex };
    if (this.currentTurn === "white") {
      targetMatrixIndex.rowIndex -= 1;
    } else {
      targetMatrixIndex.rowIndex += 1;
    }

    const targetIndex = this.boardPiecesArray.findIndex(
      (item) =>
        item.rowIndex === targetMatrixIndex.rowIndex &&
        item.colIndex === targetMatrixIndex.colIndex
    );
    if (targetIndex !== -1) {
      this.scene.remove(this.boardPiecesArray[targetIndex].mesh);
      this.boardPiecesArray.splice(targetIndex, 1);
    }
  }

  if (fromIndex !== -1) {
    if (pieceType) {
      this.boardPiecesArray[fromIndex].pieceType = pieceType;

      this.scene.remove(this.boardPiecesArray[fromIndex].mesh);

      this.boardPiecesArray[fromIndex].mesh = this.getTargetMesh(pieceType);
      const position = getMeshPosition(
        this.boardPiecesArray[fromIndex].rowIndex,
        this.boardPiecesArray[fromIndex].colIndex
      );
      this.boardPiecesArray[fromIndex].mesh.position.set(
        position.x,
        position.y,
        position.z
      );
      this.boardPiecesArray[fromIndex].mesh.scale.set(
        modelSize,
        modelSize,
        modelSize
      );
      this.boardPiecesArray[fromIndex].mesh.rotation.y =
        pieceType === pieceType.toUpperCase() ? Math.PI : 0;

      this.scene.add(this.boardPiecesArray[fromIndex].mesh);
    }

    this.movePiece(
      this.boardPiecesArray[fromIndex],
      toMatrixIndex.rowIndex,
      toMatrixIndex.colIndex
    );
  }

  if (castling.whiteLong) {
    const matrixIndex = getMatrixIndexFromFen("A1");
    const rook = this.boardPiecesArray.filter(
      (item) =>
        item.rowIndex === matrixIndex.rowIndex &&
        item.colIndex === matrixIndex.colIndex
    );
    const targetIndex = getMatrixIndexFromFen("D1");

    this.movePiece(rook[0], targetIndex.rowIndex, targetIndex.colIndex);
  } else if (castling.whiteShort) {
    const matrixIndex = getMatrixIndexFromFen("H1");
    const rook = this.boardPiecesArray.filter(
      (item) =>
        item.rowIndex === matrixIndex.rowIndex &&
        item.colIndex === matrixIndex.colIndex
    );
    const targetIndex = getMatrixIndexFromFen("F1");

    this.movePiece(rook[0], targetIndex.rowIndex, targetIndex.colIndex);
  } else if (castling.blackLong) {
    const matrixIndex = getMatrixIndexFromFen("A8");
    const rook = this.boardPiecesArray.filter(
      (item) =>
        item.rowIndex === matrixIndex.rowIndex &&
        item.colIndex === matrixIndex.colIndex
    );
    const targetIndex = getMatrixIndexFromFen("D8");

    this.movePiece(rook[0], targetIndex.rowIndex, targetIndex.colIndex);
  } else if (castling.blackShort) {
    const matrixIndex = getMatrixIndexFromFen("H8");
    const rook = this.boardPiecesArray.filter(
      (item) =>
        item.rowIndex === matrixIndex.rowIndex &&
        item.colIndex === matrixIndex.colIndex
    );
    const targetIndex = getMatrixIndexFromFen("F8");

    this.movePiece(rook[0], targetIndex.rowIndex, targetIndex.colIndex);
  }

  if (this.selectedPiece) {
    this.selectedPiece.mesh.position.y = this.selectedPiece.currentY;
    this.selectedPiece = null;
  }
  this.possibleMoves = [];
}
