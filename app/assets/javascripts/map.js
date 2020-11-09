let map
let geocoder

function initMap() {
  // geocoderを初期化しジオコーディングサービスにアクセス
  geocoder = new google.maps.Geocoder()

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });
}

function codeAddress() {
  // id=addressのinputタグに記入された値（value）を取得
  let inputAddress = document.getElementById('address').value;

  // ジオコーディングサービスにリクエストを行なう。コールバックには results と status コードの順で2つのパラメータが渡される。
  geocoder.geocode({'address': inputAddress}, function (results, status) {
    if (status == 'OK') {
      // map.setCenterで地図が移動（location には緯度経度の値が含まれる）
      map.setCenter(results[0].geometry.location);
      // google.maps.MarkerでGoogleMap上の指定位置にマーカが立つ
      var marker = new google.maps.Marker({
        // マーカーのオプション
        map: map,
        position: results[0].geometry.location
    });
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

