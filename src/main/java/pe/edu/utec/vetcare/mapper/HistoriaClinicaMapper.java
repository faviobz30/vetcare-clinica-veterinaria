package pe.edu.utec.vetcare.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pe.edu.utec.vetcare.dto.response.HistoriaClinicaResponse;
import pe.edu.utec.vetcare.entity.HistoriaClinicaEntity;

@Mapper(componentModel = "spring")
public interface HistoriaClinicaMapper {

    @Mapping(
            source = "mascota.idMascota",
            target = "idMascota"
    )
    @Mapping(
            source = "mascota.nombre",
            target = "nombreMascota"
    )
    HistoriaClinicaResponse toResponse(
            HistoriaClinicaEntity entity
    );
}