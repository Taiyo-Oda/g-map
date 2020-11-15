function createMarker(options) {
  let m = new google.maps.Marker(options);
  return m;
}

// マップを作成
function initMap() {
  // geocoderを初期化しジオコーディングサービスにアクセス
  geocoder = new google.maps.Geocoder()
  // Geolocation APIに対応している場合
  if (navigator.geolocation) {
    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      // 取得成功した場合
      function(position) {
        // 緯度・経度を変数に格納
        let mapLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        // マップオブジェクト作成
        map = new google.maps.Map(document.getElementById("map"), {
          center: mapLatLng,
          zoom: 17,
        })
        // マーカーの作成
        createMarker ({
          map: map,
          position: mapLatLng
        })
      },
      // 取得失敗した場合
      function(error) {
        // エラーメッセージを表示
        switch(error.code) {
          case 1: // PERMISSION_DENIED
            alert("位置情報の利用が許可されていません");
            break;
          case 2: // POSITION_UNAVAILABLE
            alert("現在位置が取得できませんでした");
            break;
          case 3: // TIMEOUT
            alert("タイムアウトになりました");
            break;
          default:
            alert("その他のエラー(エラーコード:"+error.code+")");
            break;
        }
      }
    )  
  } else {
    alert("この端末では位置情報が取得できません");
  }
}

// 地図の移動、周辺情報の取得
function codeAddress() {
  // document.getElementById("map").innerHTML = "";
  // id=addressのinputタグに記入された値（value）を取得
  let inputAddress = document.getElementById('address').value;
  let inputStoreName = document.getElementById('storeName').value;
  // ジオコーディングサービスにリクエストを行なう。コールバックには results と status コードの順で2つのパラメータが渡される。
  geocoder.geocode({'address': inputAddress}, function (results, status) {
    if (status == 'OK') {
      // map.setCenterで地図が移動（location には緯度経度の値が含まれる）
      map.setCenter(results[0].geometry.location);
      // google.maps.MarkerでGoogleMap上の指定位置にマーカが立つ
      createMarker({
        // マーカーのオプション
        map: map,
        position: results[0].geometry.location
      });
      var service = new google.maps.places.PlacesService(map);
      service.textSearch({
        location: results[0].geometry.location,
        radius: 500,
        query: inputStoreName
      }, function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          createMarkers(results, map);
        }
      });
    } else {
      alert('次の理由でジオコードが成功しませんでした: ' + status);
    }
  });
}

// map上にマーカーを作成
function createMarkers(places, map) {
  // LatLngBoundsクラスは境界(範囲)のインスタンスを作成する（ここでは空の境界変数を作成）
  const bounds = new google.maps.LatLngBounds();
  const placesList = document.getElementById("places");
  // textSearchした店のマーカーを１つずつ作成
  for (let i = 0, place; (place = places[i]); i++) {
    // 地図上に表示するMarkerのimageを作成
    const image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25),
    }
    // 作成したimageを使ってマーカーを作成
    createMarker ({
      map,
      icon: image,
      title: place.name,
      position: place.geometry.location,
    })
    // 検索結果からli要素を作成（取得した施設のリスト）
    const li = document.createElement("li");
    li.textContent = place.name;
    // #placesの子要素としてliを作成
    placesList.appendChild(li);
    // 空の境界変数を取得し、マーカーを表示するlatとlngを指定
    bounds.extend(place.geometry.location);
  }
  // mapが全てのマーカーが表示されるようなサイズになる
  map.fitBounds(bounds);
}

// service = new google.maps.places.PlacesService(map)
// let getNextPage;
// let moreButton = document.getElementById("more");

// moreButton.onclick = function () {
//   // moreButtonにdisabled属性を設定（disabled属性を設定するとその値は送信されなくなる）
//   moreButton.disabled = true;

//   // getNextPageが可能な場合
//   if (getNextPage) {
//     getNextPage();
//   }
// }
// 指定した地点の周辺の情報を取得する
// service.nearbySearch(
//   { location: mapLatLng, radius: 500, type: "store" },
//   (results, status, pagination) => {
//     if (status !== "OK") return;
//     // 検索にヒットした施設にマーカーを設置
//     createMarkers(results, map);
//     // hasNextPageはさらに結果が利用可能かどうかを示す
//     moreButton.disabled = !pagination.hasNextPage;
//     // さらに検索結果が表示可能な場合（pagination.hasNextPageがtrueの場合）
//     if (pagination.hasNextPage) {
//       // nextPage()は次の結果セットを返す関数
//       getNextPage = pagination.nextPage;
//     }
//   }
// )