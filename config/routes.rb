Rails.application.routes.draw do
  get 'maps/index'
  root to: 'maps#index'
  resources :maps, only: [:index]
end
