import React, { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather as Icon } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SvgUri } from 'react-native-svg';
import MapView, {Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../../services/api';

interface Item{ //Lista dos itens
  id: number;
  title: string;
  image_url: string;
}

interface Points {//Atributos dos pontos de coleta
  id: number;
  image: string;
  name: string;
  latitude: number;
  longitude: number;
  image_url: string;
}

interface Params {//Recebe a Cidade e Estado(UF) que o usuario escolheu/digitou na tela anterior
  uf: string;
  city: string;
}

const Points = () => {

    const [items, setItems] =  useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [ initialPosition, setIntialPosition ] = useState<[number, number]>([0, 0]);
    const [points, setPoints] = useState<Points[]>([]);
    
    const navigation = useNavigation();
    const route = useRoute();

    const routeParams = route.params as Params;

    useEffect(() => {//Obter localização do usuario
      async function loadPosition(){
        const{ status } = await Location.requestPermissionsAsync();

        if(status !== 'granted'){
          Alert.alert('Ooooops!', 'Precisamos de sua permissão para obtermos a sua localização :)');
          return;
        }

        const location = await Location.getCurrentPositionAsync();

        const { latitude, longitude } = location.coords;

        setIntialPosition([
          latitude,
          longitude
        ])
      }

      loadPosition();
    }, []);

    useEffect(() => {//Buscar itens da api
      api.get('items').then(response => {
        setItems(response.data);
      });
    }, []);

    useEffect(() => {//Buscar locais no mapa
      api.get('points', {
        params: {
          city: routeParams.city,
          uf: routeParams.uf,
          items: selectedItems
        }
      }).then(response => {
        setPoints(response.data);
      });
    }, [selectedItems]);

    function handleNavigationBack(){//Voltar para a tela anterior
        navigation.goBack();
    }

    function handleNavigateToDetail(id : number){//Ir para a proxima tela
        navigation.navigate('Detalhe', { point_id: id });
    }

    function handleSelectedItem(id : number){
      const alreadySelected = selectedItems.findIndex(item => item === id);   //Vai verificar os itens que o usuario seleciona

      if(alreadySelected >= 0){
          const filteredItems = selectedItems.filter(item => item !== id);//Filtra os itens armazenado no state(Vai remover os itens que o usuario desmarcar)

          setSelectedItems(filteredItems);
      } else {
          setSelectedItems([...selectedItems, id]);
      }
    }
    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity onPress={handleNavigationBack}>
                    <Icon name="arrow-left" size={20} color="#34cb79" />
                </TouchableOpacity>

                <Text style={styles.title} >Bem Vindo</Text>
                <Text style={styles.description} >Encontre no mapa um ponto de coleta.</Text>

                <View style={styles.mapContainer} >
                    { initialPosition[0] !== 0 && (
                      <MapView initialRegion={{ 
                        latitude: initialPosition[0], 
                        longitude: initialPosition[1],
                        latitudeDelta: 0.014,
                        longitudeDelta: 0.014 
                        }} 
                        style={styles.map} 
                      >
                        {points.map(pontos => (
                            <Marker 
                            key={String(pontos.id)}
                            onPress={() => handleNavigateToDetail(pontos.id)}
                            style={styles.mapMarker}
                            coordinate={{ 
                                latitude: pontos.latitude, 
                                longitude: pontos.longitude, 
                              }} 
                            >
                              <View style={styles.mapMarkerContainer}>
                                  <Image style={styles.mapMarkerImage} source={{ uri: pontos.image_url }} />
                                  <Text style={styles.mapMarkerTitle} >{pontos.name}</Text>
                              </View>
                            </Marker>
                        ))}
                      </MapView>
                    )}
                </View>
            </View>
            <View style={styles.itemsContainer} >
                <ScrollView horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 26 }}
                >
                    {items.map(item => (
                      <TouchableOpacity 
                        activeOpacity={0.6}
                        key={String(item.id)} 
                        style={[
                          styles.item,
                          selectedItems.includes(item.id) ? styles.selectedItem : {}
                        ]} 
                        onPress={()=>handleSelectedItem(item.id)} 
                      >
                        <SvgUri width={42} height={42} uri={item.image_url} />
                        <Text style={styles.itemTitle}>{item.title}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 20 + Constants.statusBarHeight,
      },
  
    title: {
      fontSize: 20,
      fontFamily: 'Ubuntu_700Bold',
      marginTop: 24,
    },
  
    description: {
      color: '#6C6C80',
      fontSize: 16,
      marginTop: 4,
      fontFamily: 'Roboto_400Regular',
    },
  
    mapContainer: {
      flex: 1,
      width: '100%',
      borderRadius: 10,
      overflow: 'hidden',
      marginTop: 16,
    },
  
    map: {
      width: '100%',
      height: '100%',
    },
  
    mapMarker: {
      width: 90,
      height: 80, 
    },
  
    mapMarkerContainer: {
      width: 90,
      height: 70,
      backgroundColor: '#34CB79',
      flexDirection: 'column',
      borderRadius: 8,
      overflow: 'hidden',
      alignItems: 'center'
    },
  
    mapMarkerImage: {
      width: 90,
      height: 45,
      resizeMode: 'cover',
    },
  
    mapMarkerTitle: {
      flex: 1,
      fontFamily: 'Roboto_400Regular',
      color: '#FFF',
      fontSize: 13,
      lineHeight: 23,
    },
  
    itemsContainer: {
      flexDirection: 'row',
      marginTop: 16,
      marginBottom: 32,
    },
  
    item: {
      backgroundColor: '#fff',
      borderWidth: 2,
      borderColor: '#eee',
      height: 120,
      width: 120,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
  
      textAlign: 'center',
    },
  
    selectedItem: {
      borderColor: '#34CB79',
      borderWidth: 2,
    },
  
    itemTitle: {
      fontFamily: 'Roboto_400Regular',
      textAlign: 'center',
      fontSize: 13,
    },
  });

export default Points;