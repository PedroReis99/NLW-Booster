import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../Services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet'
import logo from '../../assets/logo.svg';
import './styles.css';

import Dropzone from '../../components/Dropzone';
//Quando cria um estado de um array ou objeto: manualmente informar o tipo da variavel

const CreatePoint = () => {
    const [ items, setItems ] = useState<Item[]>([]);
    const [ Ufs, setUfs ] = useState<string[]>([]);
    const [ cities, setCities ] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    const [initialPosition, setInitialPosition ] = useState<[number, number]>([0, 0]);//posição inicial do mapa

    const [selectedItems, setSelectedItems] = useState<number[]>([]);//Armazena os itens de coleta escolhidos pelo usuario
    const [selectedUf, setSelectedUf ] = useState('0');//Armazena a Uf escolhida pelo usuario
    const [selectedCity, setSelectedCity ] = useState('0');//Armazena a Cidade escolhida pelo usuario
    const [selectedPosition, setSelectedPosition ] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile ] = useState<File>();

    const history = useHistory();
    //interface para os itens de coleta
    interface Item {
        id: number,
        title: string,
        image_url: string
    }
    //interface para as UFs
    interface IBGEUFResponse {
        sigla: string;
    }
    interface IBGECityResponse{
        nome: string;
    }

    //Dispara quando a tela carregar para mostrar a localização inicial do usuario
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPosition([ latitude, longitude ]);
        });
    }, []);

    //Listagem dos itens de coleta
    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, []);

    //Api do IBGE para a busca de localidade
    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
            .then(response => {
                const ufInitials = response.data.map(uf => uf.sigla);

                setUfs(ufInitials);
            });
    }, []);
    
    useEffect(() => {//Carregar as cidades quando o usuario escolher a uf
        if(selectedUf === '0'){
            return;
        }

        axios.get<IBGECityResponse[]>
            (`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
                .then(response => {
                    const cityNames = response.data.map(city => city.nome);

                    setCities(cityNames);
                });
    }, [selectedUf]);

    function handleSelectUf(event : ChangeEvent<HTMLSelectElement>){
        const uf = event.target.value;

        setSelectedUf(uf);
    }

    function handleSelectedCity(event : ChangeEvent<HTMLSelectElement>){
        const city = event.target.value;

        setSelectedCity(city);
    }

    function handleMapClick(event : LeafletMouseEvent){
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng,
        ]);
    }

    function handleInputChange(event : ChangeEvent<HTMLInputElement>){
        const { name, value } = event.target;

        setFormData({ ...formData, [ name ] : value });
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

    async function handleSubmit(event : FormEvent){
        event.preventDefault();

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [ latitude, longitude ] = selectedPosition;
        const items = selectedItems;

        const data  = new FormData();

        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('longitude', String(longitude));
        data.append('items', items.join(','));
        
        if(selectedFile) {
            data.append('image', selectedFile);
        }

        await api.post('points', data);

        alert('Ponto de coleta criado');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Logo Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para Home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br />ponto de coleta</h1>

                <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da Entidade</label>
                        <input type="text" 
                            name="name" 
                            id="name" 
                            onChange={handleInputChange}
                        />
                    </div>
                    
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" 
                                name="email" 
                                id="email" 
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" 
                                name="whatsapp" 
                                id="whatsapp" 
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={ initialPosition } zoom={12.5} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}/>
                    </Map>
                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                                <option value="0">Selecione uma UF</option>
                                {Ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => (
                            <li key={item.id} 
                                onClick={() => handleSelectedItem(item.id)}
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;