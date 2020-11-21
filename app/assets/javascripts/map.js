// 作成したマーカーの情報を格納
markers = []
// 検索結果を格納
lists = []

// マップを作成
function initMap() {
  // Geolocation APIに対応している場合
  if (navigator.geolocation) {
    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      // 取得成功した場合
      function(position) {
        // 緯度・経度を変数に格納
        mapLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        // マップオブジェクト作成
        map = new google.maps.Map(document.getElementById("map"), {
          center: mapLatLng,
          zoom: 17,
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
  // geocoderを初期化しジオコーディングサービスにアクセス
  geocoder = new google.maps.Geocoder()
  // inputタグに記入された値（value）を取得
  let inputAddress = document.getElementById('address').value;
  let inputStoreName = document.getElementById('storeName').value;
  if (inputAddress.match('現在地')) {
    var address = {location: mapLatLng}
  } else {
    var address = {'address': inputAddress}
  }
  // ジオコーディングサービスにリクエストを行なう。コールバックには results と status コードの順で2つのパラメータが渡される。
  geocoder.geocode(address, function (results, status) {
    if (status == 'OK') {
      let location = results[0].geometry.location
      // 関数呼び出し(マーカー削除)
      deleteMarkers();
      // map.setCenterで地図が移動（location には緯度経度の値が含まれる）
      map.setCenter(location);
      // google.maps.MarkerでGoogleMap上の指定位置にマーカが立つ
      let center = new google.maps.Marker({
        // マーカーのオプション
        map: map,
        position: location
      });
      // 作成したマーカーの情報を配列に格納
      markers.push(center);

      let service = new google.maps.places.PlacesService(map);
      let getNextPage;
      let moreButton = document.getElementById("more");

      moreButton.onclick = function () {
        // moreButtonにdisabled属性を設定（disabled属性を設定するとその値は送信されなくなる）
        moreButton.disabled = true;
        getNextPage.nextPage();
      }

      service.textSearch({
        location: location,
        radius: 500,
        query: inputStoreName
      }, function(results, status, pagination) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          // 配列に検索結果を格納
          lists = lists.concat(results);
          // 評価の高い順に並べ替える
          lists.sort(function(a, b) {
            return b.rating - a.rating;
          });
          distance(inputAddress, location, lists);
          // 新しくulを作り直す
          document.getElementById("places").innerHTML = "";
          // 関数呼び出し（マーカー作成）
          createMarkers(lists, map);
          // hasNextPageはさらに結果が利用可能かどうかを示す
          moreButton.disabled = !pagination.hasNextPage;
          // さらに検索結果が表示可能な場合（pagination.hasNextPageがtrueの場合）
          if (pagination.hasNextPage) {
            // 変数に検索結果の追加情報を代入
            getNextPage = pagination
          }
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
    let marker = new google.maps.Marker ({
      map,
      icon: image,
      title: place.name,
      position: place.geometry.location,
    })
    // 作成したマーカーの情報を配列に格納
    markers.push(marker);
    // 検索結果からli要素を作成（取得した施設のリスト）
    const li = document.createElement("li");
    li.textContent = place.name + place.rating;
    // #placesの子要素としてliを作成
    placesList.appendChild(li);
    // 空の境界変数を取得し、マーカーを表示するlatとlngを指定
    bounds.extend(place.geometry.location);
  }
  // mapが全てのマーカーが表示されるようなサイズになる
  map.fitBounds(bounds);
}


// 取得済みの情報を削除
function deleteMarkers() {
  // 検索結果を削除する
  lists.length = 0;
  document.getElementById("places").innerHTML = "";
  // すでに作成してあるマーカーを削除する
  markers.forEach(function(d_marker, i){
    d_marker.setMap(null);
  });
}


function distance(inputAddress, location, destinations) {
  // DistanceMatrix サービスを生成
  var distanceMatrixService = new google.maps.DistanceMatrixService();
  for (let i = 0, destination; (destination = destinations[i]); i++) {
    // 出発点
    var orign1 = location;
    var orign2 = inputAddress;
    // 到着点
    var destination1 = destination.geometry.location;
    var destination2 = destination.name;
    // DistanceMatrix の実行
    distanceMatrixService.getDistanceMatrix({
      origins: [orign1, orign2], // 出発地点
      destinations: [destination1, destination2], // 到着地点
      travelMode: google.maps.TravelMode.DRIVING, // 車モード or 徒歩モード
    }, function (response, status) {
      if (status == google.maps.DistanceMatrixStatus.OK) {
        result = response.rows[0].elements[0];
        var distance = result.distance.text;
        var duration = result.duration.text;
        console.log(distance, duration)
      }
    });
  }
}