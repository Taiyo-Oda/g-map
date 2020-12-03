// 作成したマーカーの情報を格納
markers = []
// 検索結果を格納
lists = []

let activeInfoWindow;

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
  inputAddress = document.getElementById('address').value;
  inputStoreName = document.getElementById('storeName').value;
  if (inputAddress.match('現在地')) {
    var address = {location: mapLatLng}
  } else {
    var address = {'address': inputAddress}
  }
  // ジオコーディングサービスにリクエストを行なう。コールバックには results と status コードの順で2つのパラメータが渡される。
  geocoder.geocode(address, function (results, status) {
    if (status == 'OK') {
      loc = results[0].geometry.location
      // 関数呼び出し(マーカー削除)
      deleteMarkers();
      // map.setCenterで地図が移動（location には緯度経度の値が含まれる）
      map.setCenter(loc);
      // google.maps.MarkerでGoogleMap上の指定位置にマーカが立つ
      let center = new google.maps.Marker({
        // マーカーのオプション
        map: map,
        position: loc
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
        location: loc,
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
          // 新しくulを作り直す
          document.getElementById("places").innerHTML = "";
          // 表示するリストを作成
          createLists(lists);
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


// 表示する店のリストを作成
function createLists(places) {
  let places1;
  let places2;
  let places3;
  let dLocations = [];
  const placesList = document.getElementById("places");
  // DistanceMatrix サービスを生成
  let distanceMatrixService = new google.maps.DistanceMatrixService();
  for (let i = 0, destination; (destination = places[i]); i++) { 
    var dLocation = destination.geometry.location
    dLocations.push(dLocation);
  }
  // DistanceMatrix の実行
  switch (true) {
    case dLocations.length <= 25:
      distanceMatrixService.getDistanceMatrix({ 
        origins: [loc], // 出発地点
        destinations: dLocations, // 到着地点
        travelMode: google.maps.TravelMode.WALKING, //徒歩モード
      }, function (response, status) {
        if (status == google.maps.DistanceMatrixStatus.OK) {
          result = response.rows[0].elements;
          var resultHTML = "<ol>";
          for (let j = 0; j < result.length; j++) {
            let content = "【" + places[j].rating + "】 " + places[j].name  + " " + result[j].distance.text + " " + result[j].duration.text;
            var name = places[j].name;
            var url = encodeURIComponent(places[j].name + " " + places[j].formatted_address);
            resultHTML += "<li>";
            resultHTML += "<a href=\"javascript: void(0);\"";
            resultHTML += "onclick=\"createInfo(";
            resultHTML += "'" + name + "',";
            resultHTML += "'" + url + "',";
            resultHTML += j + ")\"";
            resultHTML += "id=searchInfo>";
            resultHTML += content;
            resultHTML += "</a>";
            resultHTML += "</li>";
          }
          resultHTML += "</ol>";
          //結果表示
          document.getElementById("places").innerHTML = resultHTML;
        }
      });
      break;
    case dLocations.length > 25 && 40 >= dLocations.length:
      var dss = [dLocations.slice(0,20), dLocations.slice(20,40)]
      places1 = places.slice(0,20);
      places2 = places.slice(20,40);
      var pss= [places1, places2]
      for (let i = 0; i < dss.length; i++) {
        distanceMatrixService.getDistanceMatrix({ 
          origins: [loc], // 出発地点
          destinations: dss[i], // 到着地点
          travelMode: google.maps.TravelMode.WALKING, //徒歩モード
        }, function (response, status) {
          if (status == google.maps.DistanceMatrixStatus.OK) {
            result = response.rows[0].elements;
            // var resultHTML = "<ol>";
            for (let j = 0; j < result.length; j++) {
              let li = document.createElement("li");
              li.textContent = pss[i][j].name + " " + pss[i][j].rating + " " + result[j].distance.text + " " + result[j].duration.text;
              // #placesの子要素としてliを作成
              placesList.appendChild(li);
              // let content = "【" + pss[i][j].rating + "】 " + pss[i][j].name  + " " + result[j].distance.text + " " + result[j].duration.text;
              // var name = pss[i][j].name;
              // var url = encodeURIComponent(pss[i][j].name + " " + pss[i][j].formatted_address);
              // resultHTML += "<li>";
              // resultHTML += "<a href=\"javascript: void(0);\"";
              // resultHTML += "onclick=\"createInfo(";
              // resultHTML += "'" + name + "',";
              // resultHTML += "'" + url + "',";
              // resultHTML += j + ")\"";
              // resultHTML += "id=searchInfo>";
              // resultHTML += content;
              // resultHTML += "</a>";
              // resultHTML += "</li>";
            }
            // resultHTML += "</ol>";
            // // 結果表示
            // document.getElementById("places").innerHTML = resultHTML;
          }
        });
      }
      break;
    case dLocations.length > 40:
      var dss = [dLocations.slice(0,20), dLocations.slice(20,40), dLocations.slice(40,60)]
      places1 = places.slice(0,20);
      places2 = places.slice(20,40);
      places3 = places.slice(40,60);
      var pss= [places1, places2, places3]
      for (let i = 0; i < dss.length; i++) {
        distanceMatrixService.getDistanceMatrix({ 
          origins: [loc], // 出発地点
          destinations: dss[i], // 到着地点
          travelMode: google.maps.TravelMode.WALKING, //徒歩モード
        }, function (response, status) {
          if (status == google.maps.DistanceMatrixStatus.OK) {
            result = response.rows[0].elements;
            for (let j = 0; j < result.length; j++) {
              let li = document.createElement("li");
              li.textContent = pss[i][j].name + " " + pss[i][j].rating + " " + result[j].distance.text + " " + result[j].duration.text;
              // #placesの子要素としてliを作成
              placesList.appendChild(li);
            }
          }
        });
      }
      break;
    default:
      console.log('その他')
  }
}


// map上にマーカーを作成
function createMarkers(places, map) {
  // LatLngBoundsクラスは境界(範囲)のインスタンスを作成する（ここでは空の境界変数を作成）
  const bounds = new google.maps.LatLngBounds();
  // const placesList = document.getElementById("places");
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
    marker = new google.maps.Marker ({
      map,
      // icon: image,
      animation: google.maps.Animation.DROP,
      title: place.name,
      position: place.geometry.location,
    })
    // 作成したマーカーの情報を配列に格納
    markers.push(marker);
    // 空の境界変数を取得し、マーカーを表示するlatとlngを指定
    bounds.extend(place.geometry.location);
  }
  // mapが全てのマーカーが表示されるようなサイズになる
  map.fitBounds(bounds);
}


// 情報窓の表示
function createInfo(name, url, j) {
  const contentString =
    '<div id="content">' +
    '<div id="siteNotice">' +
    "</div>" +
    '<h3 id="firstHeading" class="firstHeading">' + name + '</h3>' +
    '<div id="bodyContent">' +
    "<p><b>Uluru</b>, txit</p>" +
    "<a href=\"https://maps.google.co.jp/maps?q=" + url + "&z=15&iwloc=A\"target=\"_blank\">" + "詳細" +
    "</a><br />"
    "</div>" +
    "</div>";

  j = j + 1
  const infowindow = new google.maps.InfoWindow({
    content: contentString,
  });

  if (activeInfoWindow) { activeInfoWindow.close();}
  infowindow.open(map, markers[j]);
  activeInfoWindow = infowindow;
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
